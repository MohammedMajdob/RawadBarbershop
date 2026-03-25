import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingCleanupService } from './booking-cleanup.service';
import { SmsModule } from '../sms/sms.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SmsModule, AuthModule],
  controllers: [BookingController],
  providers: [BookingService, BookingCleanupService],
})
export class BookingModule {}
