import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private smsService: SmsService,
  ) {}

  // ─── Admin Login (existing) ──────────────────────────────────

  async login(username: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { username },
    });

    if (!admin) {
      throw new UnauthorizedException('שם משתמש או סיסמה שגויים');
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      throw new UnauthorizedException('שם משתמש או סיסמה שגויים');
    }

    const token = this.jwt.sign({ sub: admin.id, username: admin.username });

    return { accessToken: token };
  }

  async validateUser(payload: { sub: string }) {
    return this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
    });
  }

  // ─── Customer OTP Authentication ─────────────────────────────

  async sendOtp(phone: string): Promise<{ message: string }> {
    const sent = await this.smsService.sendOtp(phone);
    if (!sent) {
      throw new InternalServerErrorException(
        'Failed to send OTP. Please try again later.',
      );
    }

    this.logger.log(`OTP sent to ${phone}`);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{ accessToken: string; isNewUser: boolean }> {
    const isValid = await this.smsService.checkOtp(phone, code);

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find or create customer
    let customer = await this.prisma.customer.findUnique({
      where: { phone },
    });

    const isNewUser = !customer;

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: { phone },
      });
      this.logger.log(`New customer created: ${phone}`);
    }

    // Issue JWT
    const token = this.jwt.sign({
      sub: customer.id,
      phone: customer.phone,
      role: 'customer',
    });

    return { accessToken: token, isNewUser };
  }

  // ─── Customer Profile ──────────────────────────────────────────

  async getCustomerProfile(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new UnauthorizedException('לקוח לא נמצא');
    }

    return {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
    };
  }

  async updateCustomerName(customerId: string, name: string) {
    const customer = await this.prisma.customer.update({
      where: { id: customerId },
      data: { name: name.trim() },
    });

    return {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
    };
  }

  async deleteCustomerProfile(customerId: string) {
    // Cancel all future confirmed bookings
    const today = new Date().toISOString().split('T')[0];
    await this.prisma.booking.updateMany({
      where: {
        customerId,
        status: 'CONFIRMED',
        date: { gte: today },
      },
      data: { status: 'CANCELLED' },
    });

    // Delete customer
    await this.prisma.customer.delete({
      where: { id: customerId },
    });

    return { message: 'הפרופיל נמחק בהצלחה' };
  }
}
