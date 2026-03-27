import { Controller, Get, Query, Header } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../prisma/prisma.service';

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
  @Header('Cache-Control', 'public, max-age=30, s-maxage=30')
  getPublicHeroImages() {
    return this.prisma.heroImage.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      select: { id: true, url: true, title: true },
    });
  }

  @Get('site-settings')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=60')
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
  @Header('Cache-Control', 'public, max-age=60, s-maxage=60')
  getPublicProductImages() {
    return this.prisma.productImage.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      select: { id: true, url: true, title: true },
    });
  }
}
