import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingCleanupService } from './booking-cleanup.service';
import { SmsModule } from '../sms/sms.module';
import { AuthModule } from '../auth/auth.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [SmsModule, AuthModule, PushModule],
  controllers: [BookingController],
  providers: [BookingService, BookingCleanupService],
})
export class BookingModule {}
