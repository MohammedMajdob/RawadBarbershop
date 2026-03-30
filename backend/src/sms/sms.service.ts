import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: any;
  private readonly verifySid: string;

  constructor(private config: ConfigService) {
    const sid = this.config.get('TWILIO_ACCOUNT_SID');
    const token = this.config.get('TWILIO_AUTH_TOKEN');
    this.verifySid = this.config.get('TWILIO_VERIFY_SID') || '';

    if (sid && token && this.verifySid) {
      const twilio = require('twilio');
      this.client = twilio(sid, token);
      this.logger.log('Twilio Verify client initialized');
    } else {
      this.logger.warn('Twilio Verify credentials not configured — running in dev mode');
    }
  }

  async sendOtp(phone: string): Promise<boolean> {
    const e164 = this.toE164(phone);

    if (!this.client) {
      this.logger.warn(`[DEV MODE] OTP requested for ${e164}`);
      return true;
    }

    try {
      await this.client.verify.v2
        .services(this.verifySid)
        .verifications.create({ to: e164, channel: 'sms' });
      this.logger.log(`Verify OTP sent to ${e164}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send Verify OTP to ${e164}: ${error.message}`);
      return false;
    }
  }

  async checkOtp(phone: string, code: string): Promise<boolean> {
    const e164 = this.toE164(phone);

    if (!this.client) {
      this.logger.warn(`[DEV MODE] OTP check for ${e164}: ${code}`);
      return code === '123456'; // dev mode accepts 123456
    }

    try {
      const check = await this.client.verify.v2
        .services(this.verifySid)
        .verificationChecks.create({ to: e164, code });
      return check.status === 'approved';
    } catch (error) {
      this.logger.error(`Failed to check Verify OTP for ${e164}: ${error.message}`);
      return false;
    }
  }

  private toE164(phone: string): string {
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('0')) return `+972${phone.slice(1)}`;
    return `+972${phone}`;
  }
}
