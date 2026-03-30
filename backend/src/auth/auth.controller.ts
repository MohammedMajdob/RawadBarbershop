import { Controller, Post, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ─── Admin OTP Login ─────────────────────────────────────────

  @Throttle({ default: { ttl: 3600000, limit: 5 } }) // 5 per hour
  @Post('admin/send-otp')
  sendAdminOtp(@Body() body: { phone: string }) {
    return this.authService.sendAdminOtp(body.phone);
  }

  @Throttle({ default: { ttl: 3600000, limit: 10 } }) // 10 attempts per hour
  @Post('admin/verify-otp')
  verifyAdminOtp(@Body() body: { phone: string; code: string }) {
    return this.authService.verifyAdminOtp(body.phone, body.code);
  }

  // ─── Customer OTP Authentication ─────────────────────────────

  @Throttle({ default: { ttl: 3600000, limit: 5 } }) // 5 per hour
  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Throttle({ default: { ttl: 3600000, limit: 10 } }) // 10 attempts per hour
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code);
  }

  // ─── Customer Profile ────────────────────────────────────────

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Request() req: any) {
    return this.authService.getCustomerProfile(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  updateProfile(@Request() req: any, @Body() body: { name: string }) {
    return this.authService.updateCustomerName(req.user.id, body.name);
  }

}
