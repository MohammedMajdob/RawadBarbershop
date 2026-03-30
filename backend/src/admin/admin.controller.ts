import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';
import { AdminService } from './admin.service';
import { ManualBookingDto } from './dto/manual-booking.dto';
import { AddImageDto, ReorderDto } from './dto/image.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ── Dashboard ─────────────────────────────────────────

  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ── Bookings ──────────────────────────────────────────

  @Get('bookings')
  getBookings(@Query('date') date?: string, @Query('status') status?: string) {
    return this.adminService.getBookings(date, status);
  }

  @Post('bookings/manual')
  createManualBooking(@Body() dto: ManualBookingDto) {
    return this.adminService.createManualBooking(dto);
  }

  @Delete('bookings/:id')
  cancelBooking(@Param('id') id: string) {
    return this.adminService.cancelBooking(id);
  }

  @Patch('bookings/:id/complete')
  completeBooking(@Param('id') id: string) {
    return this.adminService.completeBooking(id);
  }

  // ── Settings ──────────────────────────────────────────

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() body: Record<string, unknown>) {
    return this.adminService.updateSettings(body);
  }

  // ── Hero Images ───────────────────────────────────────

  @Get('hero')
  getHeroImages(@Query('all') all?: string) {
    return this.adminService.getHeroImages(all === 'true');
  }

  @Post('hero')
  addHeroImage(@Body() dto: AddImageDto) {
    return this.adminService.addHeroImage(dto.url, dto.title);
  }

  @Patch('hero/:id/toggle')
  toggleHeroImage(@Param('id') id: string) {
    return this.adminService.toggleHeroImage(id);
  }

  @Patch('hero/reorder')
  reorderHeroImages(@Body() dto: ReorderDto) {
    return this.adminService.reorderHeroImages(dto.ids);
  }

  @Delete('hero/:id')
  deleteHeroImage(@Param('id') id: string) {
    return this.adminService.deleteHeroImage(id);
  }

  // ── Product Images ─────────────────────────────────────

  @Get('products')
  getProductImages(@Query('all') all?: string) {
    return this.adminService.getProductImages(all === 'true');
  }

  @Post('products')
  addProductImage(@Body() dto: AddImageDto) {
    return this.adminService.addProductImage(dto.url, dto.title);
  }

  @Patch('products/:id/toggle')
  toggleProductImage(@Param('id') id: string) {
    return this.adminService.toggleProductImage(id);
  }

  @Patch('products/reorder')
  reorderProductImages(@Body() dto: ReorderDto) {
    return this.adminService.reorderProductImages(dto.ids);
  }

  @Delete('products/:id')
  deleteProductImage(@Param('id') id: string) {
    return this.adminService.deleteProductImage(id);
  }

  // ── Waitlist ──────────────────────────────────────────

  @Get('waitlist')
  getWaitlist() {
    return this.adminService.getWaitlist();
  }

  @Delete('waitlist/:id')
  removeFromWaitlist(@Param('id') id: string) {
    return this.adminService.removeFromWaitlist(id);
  }
}
