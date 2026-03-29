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

    if (sid && token) {
      const twilio = require('twilio');
      this.client = twilio(sid, token);
      this.logger.log('Twilio WhatsApp client initialized');
    } else {
      this.logger.warn('Twilio credentials not configured — running in dev mode');
    }
  }

  async sendOtp(phone: string, code: string): Promise<boolean> {
    if (!this.client) {
      this.logger.warn(`[DEV MODE] OTP for ${phone}: ${code}`);
      return true;
    }
    return this.sendViaWhatsApp(this.toE164(phone), code);
  }

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
      this.logger.error(`Failed to send WhatsApp OTP to ${phone}: ${error.message}`);
      return false;
    }
  }

  private toE164(phone: string): string {
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('0')) return `+972${phone.slice(1)}`;
    return `+972${phone}`;
  }

  generateOtp(): string {
    const { randomInt } = require('crypto');
    return randomInt(100000, 999999).toString();
  }
}
