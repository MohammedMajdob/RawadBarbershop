import { Controller, Get, Post, Delete, Query, Header, Body, Param } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../prisma/prisma.service';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';

@SkipThrottle() // Public read endpoints — polled frequently by frontend
@Controller('availability')
export class AvailabilityController {
  constructor(
    private availabilityService: AvailabilityService,
    private prisma: PrismaService,
  ) {}

  @Get()
  getSlots(@Query('date') date: string) {
    return this.availabilityService.getAvailableSlots(date);
  }

  @Get('dates')
  @Header('Cache-Control', 'public, max-age=30, s-maxage=30')
  getDates() {
    return this.availabilityService.getAvailableDates();
  }

  @Get('hero')
  @Header('Cache-Control', 'no-store')
  getPublicHeroImages() {
    return this.prisma.heroImage.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      select: { id: true, url: true, title: true },
    });
  }

  @Get('site-settings')
  @Header('Cache-Control', 'no-store')
  async getSiteSettings() {
    const settings = await this.prisma.settings.findUnique({
      where: { id: 'default' },
      select: {
        businessName: true,
        phone: true,
        price: true,
        headerType: true,
        headerMediaUrl: true,
        logoUrl: true,
        announcementText: true,
      },
    });
    return (
      settings ?? {
        businessName: 'Gentlemen Barber Shop',
        phone: '050-2763455',
        price: 70,
        headerType: 'image',
        headerMediaUrl: null,
        logoUrl: null,
      }
    );
  }

  @Get('products')
  @Header('Cache-Control', 'no-store')
  getPublicProductImages() {
    return this.prisma.productImage.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      select: { id: true, url: true, title: true },
    });
  }

  @Post('waitlist')
  joinWaitlist(@Body() dto: JoinWaitlistDto) {
    return this.prisma.waitlistEntry.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        preferredDate: dto.preferredDate || null,
        note: dto.note || null,
      },
    });
  }
}
