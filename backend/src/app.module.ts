import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { BookingModule } from './booking/booking.module';
import { AvailabilityModule } from './availability/availability.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    BookingModule,
    AvailabilityModule,
    AdminModule,
    AuthModule,
    SmsModule,
  ],
})
export class AppModule {}
