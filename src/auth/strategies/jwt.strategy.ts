import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevokedToken } from '../entities/revoked-token.entity';
import { User } from '../../users/entities/user.entity';

export interface JwtPayload {
  sub: string; // User ID (subject — RFC 7519)
  jti: string; // Unique token ID, used for revocation on logout
  role: string; // User role (ADMIN, EDITOR, VIEWER)
  iat?: number; // Issued at — Unix timestamp in seconds (auto-set by JWT)
  exp?: number; // Expiration — Unix timestamp in seconds (auto-set by JWT)
}

export interface AuthenticatedUser {
  id: string; // User ID extracted from JWT subject (sub)
  jti: string; // Token ID, used to revoke the current token on logout
  role: string; // User role, used by RolesGuard for access control
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @InjectRepository(RevokedToken)
    private readonly revokedTokenRepository: Repository<RevokedToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const revoked = await this.revokedTokenRepository.findOne({
      where: { jti: payload.jti },
    });

    if (revoked) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User is inactive or not found');
    }

    if (
      user.lastLogoutAt &&
      payload.iat !== undefined &&
      payload.iat * 1000 < user.lastLogoutAt.getTime()
    ) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return { id: payload.sub, jti: payload.jti, role: user.role };
  }
}
