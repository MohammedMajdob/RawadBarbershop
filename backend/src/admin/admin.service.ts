import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ── Bookings ──────────────────────────────────────────

  async getBookings(date?: string, status?: string) {
    const where: any = {
      // Never show temporary hold records in admin
      NOT: { name: '_hold_', phone: '_hold_' },
    };
    if (date) where.date = date;
    if (status) where.status = status;

    return this.prisma.booking.findMany({
      where,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
  }

  async cancelBooking(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('הזמנה לא נמצאה');

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('ההזמנה כבר בוטלה');
    }
    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('לא ניתן לבטל הזמנה שהושלמה');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledBy: 'admin' },
    });
  }

  async createManualBooking(dto: { date: string; time: string; name: string; phone: string }) {
    // Normalize phone to E.164
    const normalizedPhone = dto.phone.startsWith('+')
      ? dto.phone
      : dto.phone.startsWith('0')
        ? `+972${dto.phone.slice(1)}`
        : `+972${dto.phone}`;

    const booking = await this.prisma.$transaction(async (tx) => {
      // Remove any hold for this slot
      await tx.booking.deleteMany({
        where: { date: dto.date, time: dto.time, name: '_hold_', status: 'PENDING' },
      });

      // Check slot availability
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

      // Link to existing customer if phone matches (don't create new customer)
      const existingCustomer = await tx.customer.findUnique({
        where: { phone: normalizedPhone },
      });

      return tx.booking.create({
        data: {
          name: dto.name,
          phone: normalizedPhone,
          date: dto.date,
          time: dto.time,
          status: 'CONFIRMED',
          customerId: existingCustomer?.id || null,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    });

    return {
      message: 'התור נוצר בהצלחה',
      booking: {
        id: booking.id,
        name: booking.name,
        phone: booking.phone,
        date: booking.date,
        time: booking.time,
        status: booking.status,
      },
    };
  }

  async completeBooking(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('הזמנה לא נמצאה');

    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException('ניתן להשלים רק תורים מאושרים');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }

  // ── Dashboard Stats ───────────────────────────────────

  async getDashboardStats() {
    // Use local date to avoid timezone issues (same approach as availability service)
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    const weekStartStr = weekStart.toLocaleDateString('en-CA');

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekEndStr = weekEnd.toLocaleDateString('en-CA');

    // Exclude hold records (_hold_) from all counts — they are not real bookings
    const notHold = { NOT: { name: '_hold_', phone: '_hold_' } };

    const [todayBookings, weekBookings, cancelledThisWeek, totalConfirmed] =
      await Promise.all([
        this.prisma.booking.count({
          where: {
            date: today,
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            ...notHold,
          },
        }),
        this.prisma.booking.count({
          where: {
            date: { gte: weekStartStr, lte: weekEndStr },
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            ...notHold,
          },
        }),
        this.prisma.booking.count({
          where: {
            date: { gte: weekStartStr, lte: weekEndStr },
            status: 'CANCELLED',
            ...notHold,
          },
        }),
        this.prisma.booking.count({
          where: {
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            ...notHold,
          },
        }),
      ]);

    return {
      todayBookings,
      weekBookings,
      cancelledThisWeek,
      totalConfirmed,
    };
  }

  // ── Settings ──────────────────────────────────────────

  async getSettings() {
    let settings = await this.prisma.settings.findUnique({
      where: { id: 'default' },
    });
    if (!settings) {
      settings = await this.prisma.settings.create({ data: { id: 'default' } });
    }
    return settings;
  }

  async updateSettings(data: Record<string, unknown>) {
    const updateData: Record<string, unknown> = {};
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) updateData[key] = value;
      }
    }

    return this.prisma.settings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: { id: 'default', ...updateData },
    });
  }

  // ── Hero Images ───────────────────────────────────────

  async getHeroImages(includeInactive = false) {
    const where = includeInactive ? {} : { active: true };
    return this.prisma.heroImage.findMany({
      where,
      orderBy: { order: 'asc' },
    });
  }

  async addHeroImage(url: string, title?: string) {
    const count = await this.prisma.heroImage.count({ where: { active: true } });
    return this.prisma.heroImage.create({
      data: { url, title, order: count },
    });
  }

  async toggleHeroImage(id: string) {
    const image = await this.prisma.heroImage.findUnique({ where: { id } });
    if (!image) throw new NotFoundException('תמונה לא נמצאה');

    return this.prisma.heroImage.update({
      where: { id },
      data: { active: !image.active },
    });
  }

  async deleteHeroImage(id: string) {
    return this.prisma.heroImage.delete({ where: { id } });
  }

  async reorderHeroImages(ids: string[]) {
    const updates = ids.map((id, index) =>
      this.prisma.heroImage.update({
        where: { id },
        data: { order: index },
      }),
    );
    await this.prisma.$transaction(updates);
    return this.getHeroImages(true);
  }
}
