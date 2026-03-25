import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

interface OtpEntry {
  hash: string;
  expiresAt: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

@Injectable()
export class OtpStoreService {
  private readonly logger = new Logger(OtpStoreService.name);
  private readonly otpStore = new Map<string, OtpEntry>();
  private readonly rateLimitStore = new Map<string, RateLimitEntry>();

  private readonly OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS_PER_WINDOW = 3;
  private readonly BCRYPT_ROUNDS = 10;

  constructor() {
    // Cleanup expired entries every 60 seconds
    setInterval(() => this.cleanup(), 60_000);
  }

  /**
   * Check if phone has exceeded rate limit (max 3 per minute).
   * Returns true if rate limited.
   */
  isRateLimited(phone: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitStore.get(phone);

    if (!entry || now - entry.windowStart > this.RATE_LIMIT_WINDOW_MS) {
      this.rateLimitStore.set(phone, { count: 1, windowStart: now });
      return false;
    }

    if (entry.count >= this.MAX_REQUESTS_PER_WINDOW) {
      return true;
    }

    entry.count++;
    return false;
  }

  /**
   * Store a hashed OTP for a phone number with TTL.
   */
  async storeOtp(phone: string, otp: string): Promise<void> {
    const hash = await bcrypt.hash(otp, this.BCRYPT_ROUNDS);
    this.otpStore.set(phone, {
      hash,
      expiresAt: Date.now() + this.OTP_TTL_MS,
    });
    this.logger.debug(`OTP stored for ${phone}, expires in 5 minutes`);
  }

  /**
   * Verify OTP for a phone number.
   * Returns true if valid. Deletes OTP after verification (one-time use).
   */
  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const entry = this.otpStore.get(phone);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.otpStore.delete(phone);
      return false;
    }

    const isValid = await bcrypt.compare(otp, entry.hash);

    // Always delete after verification attempt (one-time use)
    this.otpStore.delete(phone);

    return isValid;
  }

  /**
   * Remove expired OTPs and stale rate limit entries.
   */
  private cleanup(): void {
    const now = Date.now();
    let otpCleaned = 0;
    let rateCleaned = 0;

    for (const [phone, entry] of this.otpStore) {
      if (now > entry.expiresAt) {
        this.otpStore.delete(phone);
        otpCleaned++;
      }
    }

    for (const [phone, entry] of this.rateLimitStore) {
      if (now - entry.windowStart > this.RATE_LIMIT_WINDOW_MS) {
        this.rateLimitStore.delete(phone);
        rateCleaned++;
      }
    }

    if (otpCleaned > 0 || rateCleaned > 0) {
      this.logger.debug(
        `Cleanup: removed ${otpCleaned} expired OTPs, ${rateCleaned} stale rate limits`,
      );
    }
  }
}
