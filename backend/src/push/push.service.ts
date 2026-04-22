import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendOptions {
  title: string;
  message: string;
  url?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly appId: string;
  private readonly apiKey: string;
  private readonly enabled: boolean;

  constructor(private config: ConfigService) {
    this.appId = this.config.get('ONESIGNAL_APP_ID') || '';
    this.apiKey = this.config.get('ONESIGNAL_REST_API_KEY') || '';
    this.enabled = !!(this.appId && this.apiKey);

    if (this.enabled) {
      this.logger.log('OneSignal push initialized');
    } else {
      this.logger.warn('OneSignal push disabled — ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY missing');
    }
  }

  async notifyAdmins(opts: SendOptions): Promise<void> {
    if (!this.enabled) {
      this.logger.warn(`[DEV] push to admins: ${opts.title} — ${opts.message}`);
      return;
    }

    try {
      const res = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${this.apiKey}`,
        },
        body: JSON.stringify({
          app_id: this.appId,
          headings: { en: opts.title, he: opts.title },
          contents: { en: opts.message, he: opts.message },
          url: opts.url,
          filters: [{ field: 'tag', key: 'role', relation: '=', value: 'admin' }],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`OneSignal send failed (${res.status}): ${text}`);
        return;
      }

      const data: any = await res.json();
      if (data.errors) {
        this.logger.warn(`OneSignal returned errors: ${JSON.stringify(data.errors)}`);
      }
    } catch (err: any) {
      this.logger.error(`OneSignal request failed: ${err.message}`);
    }
  }
}
