import { Controller, Get, Query } from '@nestjs/common';
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
  getDates() {
    return this.availabilityService.getAvailableDates();
  }

  @Get('hero')
  getPublicHeroImages() {
    return this.prisma.heroImage.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
  }
}
