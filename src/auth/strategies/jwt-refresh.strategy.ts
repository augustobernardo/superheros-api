import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevokedToken } from '../entities/revoked-token.entity';
import { User } from '../../users/entities/user.entity';
import { JwtPayload } from './jwt.strategy';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    @InjectRepository(RevokedToken)
    private readonly revokedTokenRepository: Repository<RevokedToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const secret = configService.get<string>('JWT_REFRESH_SECRET');
        if (!secret) {
          throw new Error(
            'JWT_REFRESH_SECRET environment variable is not configured',
          );
        }
        return secret;
      })(),
      passReqToCallback: true,
    });
  }

  async validate(_req: Request, payload: JwtPayload): Promise<JwtPayload> {
    const revoked = await this.revokedTokenRepository.findOne({
      where: { jti: payload.jti },
    });

    if (revoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or not found');
    }

    if (
      user.lastLogoutAt &&
      payload.iat !== undefined &&
      payload.iat * 1000 < user.lastLogoutAt.getTime()
    ) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    return payload;
  }
}
