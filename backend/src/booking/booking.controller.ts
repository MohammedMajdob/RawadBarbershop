import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle } from '@nestjs/throttler';
import { BookingService } from './booking.service';
import { StartBookingDto } from './dto/start-booking.dto';
import { VerifyBookingDto } from './dto/verify-booking.dto';

@SkipThrottle() // hold/renew called every 8s — exempt from global rate limit
@Controller('booking')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @Post('hold')
  holdSlot(@Body() dto: { date: string; time: string }) {
    return this.bookingService.holdSlot(dto);
  }

  @Delete('hold/:id')
  releaseHold(@Param('id') id: string) {
    return this.bookingService.releaseHold(id);
  }

  // POST version for sendBeacon (which only supports POST)
  @Post('hold/:id/release')
  releaseHoldBeacon(@Param('id') id: string) {
    return this.bookingService.releaseHold(id);
  }

  // Heartbeat: extend hold while user is on page
  @Post('hold/:id/renew')
  renewHold(@Param('id') id: string) {
    return this.bookingService.renewHold(id);
  }

  @Post('start')
  start(@Body() dto: StartBookingDto) {
    return this.bookingService.startBooking(dto);
  }

  @Delete(':id/cancel-pending')
  cancelPendingBooking(@Param('id') id: string) {
    return this.bookingService.cancelPendingBooking(id);
  }

  @Post('verify')
  verify(@Body() dto: VerifyBookingDto) {
    return this.bookingService.verifyBooking(dto);
  }

  // ─── Authenticated customer endpoints ──────────────────────────

  @UseGuards(AuthGuard('jwt'))
  @Post('quick')
  quickBook(@Request() req: any, @Body() dto: { date: string; time: string }) {
    return this.bookingService.quickBook(req.user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  getMyBookings(@Request() req: any) {
    return this.bookingService.getMyBookings(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('my/:id')
  cancelMyBooking(@Request() req: any, @Param('id') id: string) {
    return this.bookingService.cancelMyBooking(req.user.id, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('my/:id/reschedule')
  rescheduleMyBooking(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: { date: string; time: string },
  ) {
    return this.bookingService.rescheduleMyBooking(req.user.id, id, dto);
  }
}
