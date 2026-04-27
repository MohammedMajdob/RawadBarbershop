import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class BookingCleanupService {
  private readonly logger = new Logger(BookingCleanupService.name);

  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async cleanExpiredBookings() {
    // Delete expired holds (temporary slot locks) — they are not real bookings
    const deletedHolds = await this.prisma.booking.deleteMany({
      where: {
        status: 'PENDING',
        name: '_hold_',
        phone: '_hold_',
        expiresAt: { lt: new Date() },
      },
    });

    if (deletedHolds.count > 0) {
      this.logger.log(`מחיקת ${deletedHolds.count} נעילות שפג תוקפן`);
    }

    // Cancel expired real pending bookings (started OTP flow but never completed)
    const result = await this.prisma.booking.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'CANCELLED' },
    });

    if (result.count > 0) {
      this.logger.log(`ניקוי ${result.count} הזמנות שפג תוקפן`);
    }
  }

  // ─── Daily reminders at 10:00 AM Israel time ─────────────────────
  @Cron('0 10 * * *', { timeZone: 'Asia/Jerusalem' })
  async sendDailyReminders() {
    const today = new Date().toLocaleDateString('en-CA');

    const bookings = await this.prisma.booking.findMany({
      where: { date: today, status: 'CONFIRMED' },
      orderBy: { time: 'asc' },
    });

    if (bookings.length === 0) return;

    this.logger.log(`שליחת תזכורות ל-${bookings.length} תורים היום`);

    for (const booking of bookings) {
      const firstName = booking.name.trim().split(/\s+/)[0];
      const message = `שלום ${firstName}, תזכורת לתור היום בשעה ${booking.time} - Gentleman`;
      try {
        await this.sms.sendMessage(booking.phone, message);
      } catch (err) {
        this.logger.error(`שגיאה בשליחת תזכורת ל-${booking.phone}: ${err.message}`);
      }
    }
  }
}
