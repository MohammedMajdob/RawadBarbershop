import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { BookingModule } from './booking/booking.module';
import { AvailabilityModule } from './availability/availability.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { SmsModule } from './sms/sms.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]), // 10 requests per minute globally
    PrismaModule,
    BookingModule,
    AvailabilityModule,
    AdminModule,
    AuthModule,
    SmsModule,
    UploadModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
