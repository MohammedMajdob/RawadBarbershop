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
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
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
  createManualBooking(
    @Body() body: { date: string; time: string; name: string; phone: string },
  ) {
    return this.adminService.createManualBooking(body);
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
  addHeroImage(@Body() body: { url: string; title?: string }) {
    return this.adminService.addHeroImage(body.url, body.title);
  }

  @Patch('hero/:id/toggle')
  toggleHeroImage(@Param('id') id: string) {
    return this.adminService.toggleHeroImage(id);
  }

  @Patch('hero/reorder')
  reorderHeroImages(@Body() body: { ids: string[] }) {
    return this.adminService.reorderHeroImages(body.ids);
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
  addProductImage(@Body() body: { url: string; title?: string }) {
    return this.adminService.addProductImage(body.url, body.title);
  }

  @Patch('products/:id/toggle')
  toggleProductImage(@Param('id') id: string) {
    return this.adminService.toggleProductImage(id);
  }

  @Delete('products/:id')
  deleteProductImage(@Param('id') id: string) {
    return this.adminService.deleteProductImage(id);
  }
}
