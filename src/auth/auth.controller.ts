import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload, AuthenticatedUser } from './strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  refresh(@Body() _dto: RefreshTokenDto, @CurrentUser() payload: JwtPayload) {
    return this.authService.refresh(payload);
  }

  @Get('validate')
  validate(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      return { valid: false };
    }
    return this.authService.validateToken(req.user);
  }

  @Post('logout')
  logout(@Req() req: AuthenticatedRequest) {
    const user = req.user;
    if (!user) {
      return { message: 'Already logged out' };
    }
    return this.authService.logout(user.id, user.jti);
  }
}
