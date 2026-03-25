import { Controller, Post, Get, Patch, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ─── Admin Login (existing) ──────────────────────────────────

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  // ─── Customer OTP Authentication ─────────────────────────────

  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

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

  @UseGuards(AuthGuard('jwt'))
  @Delete('me')
  deleteProfile(@Request() req: any) {
    return this.authService.deleteCustomerProfile(req.user.id);
  }
}
