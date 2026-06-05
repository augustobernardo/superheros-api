import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevokedToken } from '../entities/revoked-token.entity';
import { User } from '../../users/entities/user.entity';

export interface JwtPayload {
  sub: string; // user ID (subject — RFC 7519)
  jti: string; // unique token ID, used for revocation on logout
  role: string; // user role (ADMIN, EDITOR, VIEWER)
  iat?: number; // issued at — Unix timestamp in seconds (auto-set by JWT)
  exp?: number; // expiration — Unix timestamp in seconds (auto-set by JWT)
}

export interface AuthenticatedUser {
  id: string; // user ID extracted from JWT subject (sub)
  jti: string; // token ID, used to revoke the current token on logout
  role: string; // user role, used by RolesGuard for access control
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
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? '',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Verify if the token has been revoked (logout)
    const revoked = await this.revokedTokenRepository.findOne({
      where: { jti: payload.jti },
    });

    if (revoked) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Verifica se o usuário ainda está ativo
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or not found');
    }

    return { id: payload.sub, jti: payload.jti, role: payload.role };
  }
}
