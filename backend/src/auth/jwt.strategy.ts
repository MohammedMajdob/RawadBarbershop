import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET')!,
    });
  }

  async validate(payload: { sub: string; role?: string; phone?: string }) {
    if (payload.role === 'customer') {
      const customer = await this.prisma.customer.findUnique({
        where: { id: payload.sub },
      });
      if (!customer) return null;
      return { ...customer, role: 'customer' };
    }

    if (payload.role === 'admin') {
      // Admin is phone-based, no DB lookup needed
      return { id: 'admin', role: 'admin' };
    }

    return null;
  }
}
