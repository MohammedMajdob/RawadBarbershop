import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingCleanupService {
  private readonly logger = new Logger(BookingCleanupService.name);

  constructor(private prisma: PrismaService) {}

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
}
