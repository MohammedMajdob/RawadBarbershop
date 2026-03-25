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
  @Header('Cache-Control', 'public, max-age=300, s-maxage=300')
  getPublicHeroImages() {
    return this.prisma.heroImage.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      select: { id: true, url: true, title: true },
    });
  }
}
