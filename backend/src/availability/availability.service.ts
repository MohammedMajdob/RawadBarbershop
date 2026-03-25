import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface TimeRange {
  start: string;
  end: string;
}

interface DaySchedule {
  isOpen: boolean;
  ranges: TimeRange[];
}

type Schedule = Record<string, DaySchedule>;

@Injectable()
export class AvailabilityService {
  private settingsCache: { data: any; expiry: number } | null = null;

  constructor(private prisma: PrismaService) {}

  async getSettings() {
    // Cache settings for 30 seconds (they rarely change)
    if (this.settingsCache && Date.now() < this.settingsCache.expiry) {
      return this.settingsCache.data;
    }

    let settings = await this.prisma.settings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await this.prisma.settings.create({
        data: { id: 'default' },
      });
    }

    this.settingsCache = { data: settings, expiry: Date.now() + 30000 };
    return settings;
  }

  private getSchedule(settings: any): Schedule {
    if (settings.schedule) return settings.schedule as Schedule;
    // Fallback: empty schedule
    const schedule: Schedule = {};
    for (let i = 0; i <= 6; i++) {
      schedule[String(i)] = { isOpen: false, ranges: [] };
    }
    return schedule;
  }

  async getAvailableSlots(date: string) {
    const settings = await this.getSettings();
    const schedule = this.getSchedule(settings);
    const duration = settings.duration || 30;
    const advanceDays = settings.advanceBookingDays || 14;

    // Check if date's day is open (parse as local date to avoid timezone shift)
    const [year, month, day] = date.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    const daySchedule = schedule[String(dayOfWeek)];

    if (!daySchedule || !daySchedule.isOpen || daySchedule.ranges.length === 0) {
      return { date, slots: [], message: 'יום זה אינו יום עבודה' };
    }

    // Check if date is blocked
    if ((settings.blockedDates || []).includes(date)) {
      return { date, slots: [], message: 'תאריך זה חסום' };
    }

    // Check date range (compare as strings YYYY-MM-DD to avoid timezone issues)
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + advanceDays);
    const maxDateStr = maxDate.toLocaleDateString('en-CA');

    if (date < todayStr) {
      return { date, slots: [], message: 'לא ניתן להזמין תור לתאריך שעבר' };
    }

    if (date > maxDateStr) {
      return { date, slots: [], message: `ניתן להזמין תור עד ${advanceDays} ימים קדימה` };
    }

    // Generate slots from all ranges for this day
    const allSlots: string[] = [];
    for (const range of daySchedule.ranges) {
      const rangeSlots = this.generateTimeSlots(range.start, range.end, duration);
      allSlots.push(...rangeSlots);
    }

    // Sort slots
    allSlots.sort();

    // Get confirmed + completed bookings (both block the slot)
    const confirmedSlots = await this.prisma.booking.findMany({
      where: { date, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      select: { time: true },
    });
    const confirmedTimes = new Set(confirmedSlots.map((b) => b.time));

    // Get held/pending bookings (temporarily locked)
    const heldSlots = await this.prisma.booking.findMany({
      where: {
        date,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      select: { time: true, expiresAt: true },
    });
    const heldMap = new Map(heldSlots.map((b) => [b.time, b.expiresAt]));

    // Filter out past times if today
    const now = new Date();
    const isToday = date === now.toLocaleDateString('en-CA');

    const slots = allSlots
      .filter((time) => {
        // Remove confirmed (fully booked) slots entirely
        if (confirmedTimes.has(time)) return false;

        // Remove past times
        if (isToday) {
          const [hours, minutes] = time.split(':').map(Number);
          const slotTime = new Date(now);
          slotTime.setHours(hours, minutes, 0, 0);
          if (slotTime <= now) return false;
        }

        return true;
      })
      .map((time) => ({
        time,
        available: !heldMap.has(time),
        held: heldMap.has(time),
        expiresAt: heldMap.get(time)?.toISOString() || null,
      }));

    // If today and all slots are gone, show "closed" message
    if (isToday && slots.length === 0) {
      return { date, slots: [], message: 'המספרה סגורה כרגע, כל השעות להיום עברו' };
    }

    return { date, slots };
  }

  async getAvailableDates() {
    const settings = await this.getSettings();
    const schedule = this.getSchedule(settings);
    const advanceDays = settings.advanceBookingDays || 14;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates: { date: string; available: boolean }[] = [];

    const now = new Date();
    const duration = settings.duration || 30;

    for (let i = 0; i <= advanceDays; i++) {
      const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD local
      const dayOfWeek = d.getDay();

      const daySchedule = schedule[String(dayOfWeek)];
      const isOpen = daySchedule?.isOpen && daySchedule.ranges.length > 0;
      const isBlocked = (settings.blockedDates || []).includes(dateStr);

      let available = isOpen && !isBlocked;

      // For today: check if there are still future time slots
      if (available && i === 0) {
        const lastRange = daySchedule.ranges[daySchedule.ranges.length - 1];
        const [endH, endM] = lastRange.end.split(':').map(Number);
        const lastSlotMinutes = (endH * 60 + endM) - duration;
        const lastSlotTime = new Date(now);
        lastSlotTime.setHours(Math.floor(lastSlotMinutes / 60), lastSlotMinutes % 60, 0, 0);
        if (now >= lastSlotTime) {
          available = false; // All slots for today have passed
        }
      }

      dates.push({
        date: dateStr,
        available,
      });
    }

    return { dates };
  }

  private generateTimeSlots(startHour: string, endHour: string, duration: number): string[] {
    const slots: string[] = [];
    const [startH, startM] = startHour.split(':').map(Number);
    const [endH, endM] = endHour.split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes < endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      currentMinutes += duration;
    }

    return slots;
  }
}
