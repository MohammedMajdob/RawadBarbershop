import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly adminPhones: Set<string>;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private smsService: SmsService,
    private config: ConfigService,
  ) {
    const raw = this.config.get<string>('ADMIN_PHONES') || '+972502763455,+972504775336';
    this.adminPhones = new Set(raw.split(',').map((p) => p.trim()));
  }

  private normalizePhone(phone: string): string {
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('0')) return `+972${phone.slice(1)}`;
    return `+972${phone}`;
  }

  // ─── Admin OTP Login ──────────────────────────────────────────

  async sendAdminOtp(phone: string): Promise<{ message: string }> {
    const normalized = this.normalizePhone(phone);
    if (!this.adminPhones.has(normalized)) {
      throw new UnauthorizedException('מספר לא מורשה');
    }
    const sent = await this.smsService.sendOtp(normalized);
    if (!sent) {
      throw new InternalServerErrorException('שגיאה בשליחת הקוד, נסה שוב');
    }
    return { message: 'קוד נשלח' };
  }

  async verifyAdminOtp(phone: string, code: string): Promise<{ accessToken: string }> {
    const normalized = this.normalizePhone(phone);
    if (!this.adminPhones.has(normalized)) {
      throw new UnauthorizedException('מספר לא מורשה');
    }
    const isValid = await this.smsService.checkOtp(normalized, code);
    if (!isValid) {
      throw new UnauthorizedException('קוד שגוי או פג תוקף');
    }
    const token = this.jwt.sign({ sub: 'admin', role: 'admin' });
    return { accessToken: token };
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
