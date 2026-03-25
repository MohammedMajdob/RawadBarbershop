import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: any;

  private readonly WHATSAPP_FROM: string;
  private readonly WHATSAPP_CONTENT_SID: string;

  constructor(private config: ConfigService) {
    this.WHATSAPP_FROM = `whatsapp:${this.config.get('TWILIO_WHATSAPP_FROM') || '+14155238886'}`;
    this.WHATSAPP_CONTENT_SID = this.config.get('WHATSAPP_CONTENT_SID') || '';
    const sid = this.config.get('TWILIO_ACCOUNT_SID');
    const token = this.config.get('TWILIO_AUTH_TOKEN');

    if (sid && token && sid !== 'your_twilio_account_sid') {
      const twilio = require('twilio');
      this.client = twilio(sid, token);
      this.logger.log('Twilio client initialized');
    } else {
      this.logger.warn('Twilio credentials not configured — running in dev mode');
    }
  }

  /**
   * Send OTP via WhatsApp first, fall back to SMS on failure.
   */
  async sendOtp(phone: string, code: string): Promise<boolean> {
    if (!this.client) {
      this.logger.warn(`[DEV MODE] OTP for ${phone}: ${code}`);
      return true;
    }

    const e164Phone = this.toE164(phone);

    // Try WhatsApp first
    const whatsappSent = await this.sendViaWhatsApp(e164Phone, code);
    if (whatsappSent) {
      return true;
    }

    // Fallback to SMS
    this.logger.warn(`WhatsApp failed for ${e164Phone}, falling back to SMS`);
    return this.sendViaSms(e164Phone, code);
  }

  /**
   * Send OTP via WhatsApp using Twilio Content Templates.
   */
  private async sendViaWhatsApp(phone: string, code: string): Promise<boolean> {
    try {
      await this.client.messages.create({
        from: this.WHATSAPP_FROM,
        to: `whatsapp:${phone}`,
        contentSid: this.WHATSAPP_CONTENT_SID,
        contentVariables: JSON.stringify({ '1': code }),
      });
      this.logger.log(`WhatsApp OTP sent to ${phone}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send WhatsApp OTP to ${phone}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Fallback: Send OTP via regular SMS.
   */
  private async sendViaSms(phone: string, code: string): Promise<boolean> {
    const from = this.config.get('TWILIO_PHONE_NUMBER');

    if (!from) {
      this.logger.error('TWILIO_PHONE_NUMBER not configured for SMS fallback');
      return false;
    }

    try {
      await this.client.messages.create({
        body: `Your barber shop verification code: ${code}`,
        from,
        to: phone,
      });
      this.logger.log(`SMS OTP sent to ${phone}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS OTP to ${phone}: ${error.message}`);
      return false;
    }
  }

  /**
   * Convert Israeli local format (05XXXXXXXX) to E.164 (+97254XXXXXXX).
   * If already in E.164 format, return as-is.
   */
  private toE164(phone: string): string {
    if (phone.startsWith('+')) {
      return phone;
    }
    if (phone.startsWith('0')) {
      return `+972${phone.slice(1)}`;
    }
    return `+972${phone}`;
  }

  /**
   * Generate a cryptographically random 6-digit OTP.
   */
  generateOtp(): string {
    const { randomInt } = require('crypto');
    return randomInt(100000, 999999).toString();
  }
}
