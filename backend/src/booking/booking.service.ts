import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { PushService } from '../push/push.service';
import { StartBookingDto } from './dto/start-booking.dto';
import { VerifyBookingDto } from './dto/verify-booking.dto';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
    private jwt: JwtService,
    private push: PushService,
  ) {}

  // ─── Hold a slot temporarily (3 min) ────────────────────────────

  async holdSlot(dto: { date: string; time: string }) {
    const hold = await this.prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          date: dto.date,
          time: dto.time,
          OR: [
            { status: { in: ['CONFIRMED', 'COMPLETED'] } },
            { status: 'PENDING', expiresAt: { gt: new Date() } },
          ],
        },
      });

      if (conflict) {
        throw new ConflictException('השעה הזו כבר תפוסה');
      }

      return tx.booking.create({
        data: {
          name: '_hold_',
          phone: '_hold_',
          date: dto.date,
          time: dto.time,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 15 * 1000), // 15 seconds, renewed by heartbeat
        },
      });
    });

    return { holdId: hold.id, expiresAt: hold.expiresAt.toISOString() };
  }

  async renewHold(holdId: string) {
    const result = await this.prisma.booking.updateMany({
      where: { id: holdId, name: '_hold_', status: 'PENDING' },
      data: { expiresAt: new Date(Date.now() + 15 * 1000) },
    });
    if (result.count === 0) {
      throw new NotFoundException('Hold not found or expired');
    }
    return { message: 'renewed' };
  }

  async releaseHold(holdId: string) {
    try {
      await this.prisma.booking.deleteMany({
        where: { id: holdId, name: '_hold_', status: 'PENDING' },
      });
    } catch {
      // ignore if already gone
    }
    return { message: 'released' };
  }

  // ─── Original flow: start booking with OTP ─────────────────────

  async startBooking(dto: StartBookingDto) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutes for full flow

    // Normalize phone to E.164 at entry point for consistent storage
    const normalizedPhone = dto.phone.startsWith('+')
      ? dto.phone
      : dto.phone.startsWith('0')
        ? `+972${dto.phone.slice(1)}`
        : `+972${dto.phone}`;

    // Use transaction to prevent race conditions
    const booking = await this.prisma.$transaction(async (tx) => {
      // Remove any hold for this slot first
      await tx.booking.deleteMany({
        where: { date: dto.date, time: dto.time, name: '_hold_', status: 'PENDING' },
      });

      // Double-check inside transaction
      const doubleCheck = await tx.booking.findFirst({
        where: {
          date: dto.date,
          time: dto.time,
          OR: [
            { status: { in: ['CONFIRMED', 'COMPLETED'] } },
            { status: 'PENDING', expiresAt: { gt: new Date() } },
          ],
        },
      });

      if (doubleCheck) {
        throw new ConflictException('השעה הזו כבר תפוסה');
      }

      return tx.booking.create({
        data: {
          name: dto.name,
          phone: normalizedPhone,
          date: dto.date,
          time: dto.time,
          status: 'PENDING',
          expiresAt,
        },
      });
    });

    // Send OTP via Twilio Verify
    await this.sms.sendOtp(normalizedPhone);

    return {
      bookingId: booking.id,
      message: 'קוד אימות נשלח לטלפון שלך',
    };
  }

  async verifyBooking(dto: VerifyBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException('הזמנה לא נמצאה');
    }

    if (booking.status === 'CONFIRMED') {
      throw new BadRequestException('ההזמנה כבר אושרה');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('ההזמנה בוטלה');
    }

    if (new Date() > booking.expiresAt) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' },
      });
      throw new BadRequestException('ההזמנה פגה תוקף, נסה שוב');
    }

    // Verify OTP via Twilio Verify
    const isValid = await this.sms.checkOtp(booking.phone, dto.otpCode);
    if (!isValid) {
      throw new BadRequestException('קוד אימות שגוי');
    }

    // Phone is already normalized (stored in E.164 by startBooking)
    // Find or create customer and link to booking
    let customer = await this.prisma.customer.findUnique({
      where: { phone: booking.phone },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: { phone: booking.phone, name: booking.name },
      });
    } else if (!customer.name && booking.name) {
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: { name: booking.name },
      });
    }

    // Confirm with transaction to prevent race condition
    const confirmed = await this.prisma.$transaction(async (tx) => {
      // Final check: make sure no one confirmed this slot while we were verifying
      const conflicting = await tx.booking.findFirst({
        where: {
          date: booking.date,
          time: booking.time,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
      });

      if (conflicting) {
        throw new ConflictException('מצטערים, מישהו אחר כבר אישר את השעה הזו');
      }

      return tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CONFIRMED',
          otpCode: null,
          otpExpiry: null,
          customerId: customer!.id,
        },
      });
    });

    // Issue JWT for the customer so they won't need OTP next time
    const accessToken = this.jwt.sign({
      sub: customer.id,
      phone: customer.phone,
      role: 'customer',
    });

    return {
      message: 'התור אושר בהצלחה!',
      accessToken,
      booking: {
        id: confirmed.id,
        name: confirmed.name,
        date: confirmed.date,
        time: confirmed.time,
        status: confirmed.status,
      },
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
      },
    };
  }

  // ─── Authenticated customer: book directly (no OTP) ────────────

  async quickBook(customerId: string, dto: { date: string; time: string }) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('לקוח לא נמצא');
    }

    if (!customer.name) {
      throw new BadRequestException('נא לעדכן שם בפרופיל');
    }

    // Use transaction to prevent race conditions
    const booking = await this.prisma.$transaction(async (tx) => {
      // Remove any hold for this slot
      await tx.booking.deleteMany({
        where: { date: dto.date, time: dto.time, name: '_hold_', status: 'PENDING' },
      });

      const conflicting = await tx.booking.findFirst({
        where: {
          date: dto.date,
          time: dto.time,
          OR: [
            { status: { in: ['CONFIRMED', 'COMPLETED'] } },
            { status: 'PENDING', expiresAt: { gt: new Date() } },
          ],
        },
      });

      if (conflicting) {
        throw new ConflictException('השעה הזו כבר תפוסה');
      }

      return tx.booking.create({
        data: {
          name: customer.name!,
          phone: customer.phone,
          date: dto.date,
          time: dto.time,
          status: 'CONFIRMED',
          customerId: customer.id,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // not relevant for confirmed
        },
      });
    });

    this.logger.log(`Quick booking created for customer ${customer.phone}: ${dto.date} ${dto.time}`);

    return {
      message: 'התור נקבע בהצלחה!',
      booking: {
        id: booking.id,
        name: booking.name,
        date: booking.date,
        time: booking.time,
        status: booking.status,
      },
    };
  }

  // ─── Get customer's bookings ───────────────────────────────────

  async getMyBookings(customerId: string) {
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local timezone

    const fields = {
      id: true,
      name: true,
      date: true,
      time: true,
      status: true,
      createdAt: true,
    };

    const [upcoming, past] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          customerId,
          status: 'CONFIRMED',
          date: { gte: today },
        },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
        select: fields,
      }),
      this.prisma.booking.findMany({
        where: {
          customerId,
          status: { in: ['CONFIRMED', 'COMPLETED', 'CANCELLED'] },
          date: { lt: today },
        },
        orderBy: [{ date: 'desc' }, { time: 'desc' }],
        take: 10,
        select: fields,
      }),
    ]);

    return { upcoming, past };
  }

  // ─── Cancel own booking ────────────────────────────────────────

  async cancelMyBooking(customerId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('התור לא נמצא');
    }

    if (booking.customerId !== customerId) {
      throw new ForbiddenException('אין לך הרשאה לבטל תור זה');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException('ניתן לבטל רק תורים מאושרים');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED', cancelledBy: 'customer' },
    });

    this.push
      .notifyAdmins({
        title: 'תור בוטל',
        message: `${updated.name} ביטל/ה את התור ליום ${updated.date} בשעה ${updated.time}`,
        url: 'https://www.gentlemen1996.co.il/admin',
      })
      .catch((err) => this.logger.warn(`Failed to push cancel notification: ${err.message}`));

    return {
      message: 'התור בוטל בהצלחה',
      booking: {
        id: updated.id,
        date: updated.date,
        time: updated.time,
        status: updated.status,
      },
    };
  }

  // ─── Reschedule own booking ────────────────────────────────────

  async rescheduleMyBooking(
    customerId: string,
    bookingId: string,
    dto: { date: string; time: string },
  ) {
    // All checks inside transaction to prevent race conditions
    const result = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new NotFoundException('התור לא נמצא');
      }

      if (booking.customerId !== customerId) {
        throw new ForbiddenException('אין לך הרשאה לעדכן תור זה');
      }

      if (booking.status !== 'CONFIRMED') {
        throw new BadRequestException('ניתן לעדכן רק תורים מאושרים');
      }

      // Remove any hold for the new slot
      await tx.booking.deleteMany({
        where: { date: dto.date, time: dto.time, name: '_hold_', status: 'PENDING' },
      });

      // Check new slot availability (exclude the booking being rescheduled)
      const conflicting = await tx.booking.findFirst({
        where: {
          date: dto.date,
          time: dto.time,
          id: { not: bookingId },
          OR: [
            { status: { in: ['CONFIRMED', 'COMPLETED'] } },
            { status: 'PENDING', expiresAt: { gt: new Date() } },
          ],
        },
      });

      if (conflicting) {
        throw new ConflictException('השעה החדשה כבר תפוסה');
      }

      // Cancel old booking
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED', cancelledBy: 'customer' },
      });

      // Create new booking with reschedule tracking
      return tx.booking.create({
        data: {
          name: booking.name,
          phone: booking.phone,
          date: dto.date,
          time: dto.time,
          status: 'CONFIRMED',
          customerId,
          rescheduledFromDate: booking.date,
          rescheduledFromTime: booking.time,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    });

    return {
      message: 'התור עודכן בהצלחה!',
      booking: {
        id: result.id,
        name: result.name,
        date: result.date,
        time: result.time,
        status: result.status,
      },
    };
  }

  // ─── Cancel unverified pending booking (user went back from OTP) ─

  async cancelPendingBooking(bookingId: string) {
    await this.prisma.booking.deleteMany({
      where: {
        id: bookingId,
        status: 'PENDING',
        otpCode: { not: null }, // only unverified bookings (not holds)
      },
    });
    return { ok: true };
  }
}
