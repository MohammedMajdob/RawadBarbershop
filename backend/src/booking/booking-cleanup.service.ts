import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingCleanupService {
  private readonly logger = new Logger(BookingCleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async cleanExpiredBookings() {
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
