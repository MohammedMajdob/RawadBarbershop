import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OtpEntry {
  code: string;
  expiresAt: number;
}

// Progressive cooldowns (seconds) before 2nd, 3rd, 4th, 5th+ send
const SEND_COOLDOWNS = [60, 120, 180, 1800];

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  // 019 Mobile SMS (primary)
  private readonly sms019Username: string;
  private readonly sms019Token: string;
  private readonly sms019Source: string;
  private readonly sms019Enabled: boolean;

  // Green API (WhatsApp fallback)
  private readonly greenInstanceId: string;
  private readonly greenToken: string;
  private readonly greenEnabled: boolean;

  // Twilio (last-resort fallback)
  private twilioClient: any;
  private readonly verifySid: string;

  // In-memory OTP store
  private readonly otpStore = new Map<string, OtpEntry>();

  // Per-phone send history for progressive rate limiting
  private readonly sendHistory = new Map<string, number[]>();

  constructor(private config: ConfigService) {
    this.sms019Username = this.config.get('SMS019_USERNAME') || '';
    this.sms019Token = this.config.get('SMS019_TOKEN') || '';
    this.sms019Source = this.config.get('SMS019_SOURCE') || '';
    this.sms019Enabled = !!(this.sms019Username && this.sms019Token && this.sms019Source);

    if (this.sms019Enabled) {
      this.logger.log(`019 SMS initialized (source: ${this.sms019Source})`);
    }

    this.greenInstanceId = this.config.get('GREEN_API_INSTANCE_ID') || '';
    this.greenToken = this.config.get('GREEN_API_TOKEN') || '';
    this.greenEnabled = !!(this.greenInstanceId && this.greenToken);

    if (this.greenEnabled) {
      this.logger.log('Green API (WhatsApp) initialized');
    }

    const sid = this.config.get('TWILIO_ACCOUNT_SID');
    const token = this.config.get('TWILIO_AUTH_TOKEN');
    this.verifySid = this.config.get('TWILIO_VERIFY_SID') || '';

    if (sid && token && this.verifySid) {
      const twilio = require('twilio');
      this.twilioClient = twilio(sid, token);
      this.logger.log('Twilio Verify initialized (fallback)');
    }

    setInterval(() => this.cleanup(), 60_000);
  }

  // ─── Send OTP ────────────────────────────────────────────────────

  async sendOtp(phone: string): Promise<boolean> {
    const e164 = this.toE164(phone);

    // Progressive rate limit per phone
    const wait = this.getRemainingCooldown(e164);
    if (wait > 0) {
      throw new BadRequestException(
        wait >= 60
          ? `ניתן לשלוח קוד חדש בעוד ${Math.ceil(wait / 60)} דקות`
          : `ניתן לשלוח קוד חדש בעוד ${wait} שניות`,
      );
    }

    // Dev mode
    if (!this.sms019Enabled && !this.greenEnabled && !this.twilioClient) {
      this.logger.warn(`[DEV MODE] OTP for ${e164} — use 123456`);
      this.recordSend(e164);
      return true;
    }

    const code = this.generateCode();

    // 1. Try 019 SMS (primary)
    if (this.sms019Enabled) {
      const sent = await this.send019(e164, `קוד האימות שלך: ${code}`);
      if (sent) {
        this.otpStore.set(e164, { code, expiresAt: Date.now() + 3 * 60 * 1000 });
        this.recordSend(e164);
        this.logger.log(`019 SMS OTP sent to ${e164}`);
        return true;
      }
      this.logger.warn(`019 SMS failed for ${e164} — falling back to WhatsApp`);
    }

    // 2. Try Green API (WhatsApp)
    if (this.greenEnabled) {
      const sent = await this.sendWhatsApp(
        e164,
        `שלום! קוד האימות שלך למספרה Gentleman: *${code}*\n\nהקוד תקף ל-3 דקות 💈`,
      );
      if (sent) {
        this.otpStore.set(e164, { code, expiresAt: Date.now() + 3 * 60 * 1000 });
        this.recordSend(e164);
        this.logger.log(`Green API OTP sent to ${e164}`);
        return true;
      }
      this.logger.warn(`Green API failed for ${e164} — falling back to Twilio SMS`);
    }

    // 3. Fallback: Twilio Verify SMS
    if (this.twilioClient) {
      try {
        await this.twilioClient.verify.v2
          .services(this.verifySid)
          .verifications.create({ to: e164, channel: 'sms' });
        // Twilio manages the code — no local storage needed
        this.recordSend(e164);
        this.logger.log(`Twilio SMS OTP sent to ${e164}`);
        return true;
      } catch (error) {
        this.logger.error(`Twilio OTP failed for ${e164}: ${error.message}`);
        return false;
      }
    }

    return false;
  }

  // ─── Check OTP ───────────────────────────────────────────────────

  async checkOtp(phone: string, code: string): Promise<boolean> {
    const e164 = this.toE164(phone);

    // Check in-memory store (Green API OTP)
    const stored = this.otpStore.get(e164);
    if (stored) {
      if (Date.now() > stored.expiresAt) {
        this.otpStore.delete(e164);
        return false;
      }
      const valid = stored.code === code;
      if (valid) this.otpStore.delete(e164);
      return valid;
    }

    // Check Twilio Verify
    if (this.twilioClient) {
      try {
        const check = await this.twilioClient.verify.v2
          .services(this.verifySid)
          .verificationChecks.create({ to: e164, code });
        return check.status === 'approved';
      } catch (error) {
        this.logger.error(`Twilio check failed for ${e164}: ${error.message}`);
        return false;
      }
    }

    // Dev mode
    return code === '123456';
  }

  // ─── Send plain message (reminders etc.) ──────────────────────────

  async sendMessage(phone: string, message: string): Promise<void> {
    const e164 = this.toE164(phone);

    // 1. Try 019 SMS (primary)
    if (this.sms019Enabled) {
      const sent = await this.send019(e164, message);
      if (sent) return;
      this.logger.warn(`019 SMS failed for ${e164} — falling back to WhatsApp`);
    }

    // 2. Fallback: WhatsApp
    if (this.greenEnabled) {
      const sent = await this.sendWhatsApp(e164, message);
      if (sent) return;
      this.logger.error(`Failed to send message to ${e164} (019 + WhatsApp both failed)`);
      return;
    }

    this.logger.warn(`[DEV MODE] message to ${e164}: ${message}`);
  }

  // ─── Progressive rate limit helpers ──────────────────────────────

  private getRemainingCooldown(phone: string): number {
    const history = this.sendHistory.get(phone) || [];
    const now = Date.now();

    // Clear history older than 31 minutes
    const recent = history.filter((t) => now - t < 31 * 60 * 1000);
    this.sendHistory.set(phone, recent);

    if (recent.length === 0) return 0;

    const lastSent = recent[recent.length - 1];
    const cooldownIdx = Math.min(recent.length - 1, SEND_COOLDOWNS.length - 1);
    const required = SEND_COOLDOWNS[cooldownIdx] * 1000;
    const elapsed = now - lastSent;

    return elapsed >= required ? 0 : Math.ceil((required - elapsed) / 1000);
  }

  private recordSend(phone: string): void {
    const history = this.sendHistory.get(phone) || [];
    history.push(Date.now());
    this.sendHistory.set(phone, history);
  }

  // ─── Internal helpers ─────────────────────────────────────────────

  private async send019(e164: string, message: string): Promise<boolean> {
    // 019 expects local format without leading + (e.g. 972501234567)
    const phone = e164.replace(/^\+/, '');

    const body = {
      sms: {
        user: { username: this.sms019Username },
        source: this.sms019Source,
        destinations: { phone },
        message,
      },
    };

    try {
      const res = await fetch('https://019sms.co.il/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${this.sms019Token}`,
        },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      if (!res.ok) {
        this.logger.error(`019 SMS HTTP ${res.status}: ${text}`);
        return false;
      }

      // 019 returns status in response — log for debugging, accept 2xx
      this.logger.log(`019 SMS response for ${phone}: ${text.slice(0, 200)}`);

      try {
        const data = JSON.parse(text);
        // 019 returns status="0" on success per their docs
        if (data?.status && String(data.status) !== '0') {
          this.logger.error(`019 SMS returned status=${data.status}: ${data.message || ''}`);
          return false;
        }
      } catch {
        // non-JSON success response — treat as ok
      }

      return true;
    } catch (error: any) {
      this.logger.error(`019 SMS request failed: ${error.message}`);
      return false;
    }
  }

  private async sendWhatsApp(e164: string, message: string): Promise<boolean> {
    const chatId = `${e164.replace('+', '')}@c.us`;
    const url = `https://api.green-api.com/waInstance${this.greenInstanceId}/sendMessage/${this.greenToken}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message }),
      });
      const data: any = await res.json();
      return res.ok && !!data.idMessage;
    } catch (error) {
      this.logger.error(`Green API request failed: ${error.message}`);
      return false;
    }
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [phone, entry] of this.otpStore) {
      if (now > entry.expiresAt) this.otpStore.delete(phone);
    }
    for (const [phone, history] of this.sendHistory) {
      const recent = history.filter((t) => now - t < 31 * 60 * 1000);
      if (recent.length === 0) this.sendHistory.delete(phone);
      else this.sendHistory.set(phone, recent);
    }
  }

  private toE164(phone: string): string {
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('0')) return `+972${phone.slice(1)}`;
    return `+972${phone}`;
  }
}
