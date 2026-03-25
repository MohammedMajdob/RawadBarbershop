import { Controller, Get, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Get()
  getSlots(@Query('date') date: string) {
    return this.availabilityService.getAvailableSlots(date);
  }

  @Get('dates')
  getDates() {
    return this.availabilityService.getAvailableDates();
  }
}
