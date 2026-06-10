import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import ms, { type StringValue } from 'ms';
import { User } from '../users/entities/user.entity';
import { RevokedToken } from './entities/revoked-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoggingService } from '../logging/logging.service';
import { JwtPayload, AuthenticatedUser } from './strategies/jwt.strategy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RevokedToken)
    private readonly revokedTokenRepository: Repository<RevokedToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.dataSource.transaction(async (manager) => {
      const existingCpf = await manager.findOne(User, {
        where: { cpf: dto.cpf },
      });
      if (existingCpf) {
        throw new ConflictException('CPF already registered');
      }

      const existingEmail = await manager.findOne(User, {
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already registered');
      }

      const user = manager.create(User, {
        cpf: dto.cpf,
        name: dto.name,
        email: dto.email,
        passwordHash,
      });

      await manager.save(User, user);
      await this.loggingService.info('User registered', { userId: user.id });
    });

    return { message: 'User registered successfully' };
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.findUserByCpfOrEmail(dto.cpfOrEmail);

    if (!user) {
      await this.loggingService.warning('Login failed: user not found', {
        cpfOrEmail: dto.cpfOrEmail,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    this.assertUserIsActive(user);

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      await this.loggingService.warning('Login failed: wrong password', {
        userId: user.id,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.loggingService.info('User logged in', { userId: user.id });

    return this.generateTokenPair(user);
  }

  async logout(userId: string, jti: string): Promise<{ message: string }> {
    await this.revokeToken(jti, userId);
    await this.userRepository.update(userId, { lastLogoutAt: new Date() });
    await this.loggingService.info('User logged out', { userId });

    return { message: 'Logged out successfully' };
  }

  async refresh(payload: JwtPayload): Promise<{ accessToken: string }> {
    const revoked = await this.revokedTokenRepository.findOne({
      where: { jti: payload.jti },
    });

    if (revoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    this.assertUserIsActive(user);

    if (
      user.lastLogoutAt &&
      payload.iat !== undefined &&
      payload.iat < Math.floor(user.lastLogoutAt.getTime() / 1000)
    ) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const jti = uuidv4();
    const accessToken = this.generateAccessToken(user, jti);

    return { accessToken };
  }

  async validateToken(user: AuthenticatedUser): Promise<{
    valid: boolean;
    user: AuthenticatedUser;
  }> {
    const dbUser = await this.userRepository.findOne({
      where: { id: user.id },
    });

    if (!dbUser || !dbUser.isActive || dbUser.deletedAt) {
      return { valid: false, user };
    }

    return { valid: true, user };
  }

  async inactivate(userId: string, jti: string): Promise<{ message: string }> {
    await this.revokeToken(jti, userId);
    await this.userRepository.update(userId, {
      isActive: false,
      lastLogoutAt: new Date(),
    });
    await this.userRepository.softDelete(userId);
    await this.loggingService.warning('User inactivated', { userId });

    return { message: 'User inactivated successfully' };
  }

  private async assertCpfNotTaken(cpf: string): Promise<void> {
    const exists = await this.userRepository.findOne({ where: { cpf } });
    if (exists) throw new ConflictException('CPF already registered');
  }

  private async assertEmailNotTaken(email: string): Promise<void> {
    const exists = await this.userRepository.findOne({ where: { email } });
    if (exists) throw new ConflictException('Email already registered');
  }

  private assertUserIsActive(user: User): void {
    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User is inactive');
    }
  }

  private async findUserByCpfOrEmail(cpfOrEmail: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [{ cpf: cpfOrEmail }, { email: cpfOrEmail }],
    });
  }

  private generateTokenPair(user: User): TokenPair {
    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    return {
      accessToken: this.generateAccessToken(user, accessJti),
      refreshToken: this.generateRefreshToken(user, refreshJti),
    };
  }

  private generateAccessToken(user: User, jti: string): string {
    return this.jwtService.sign(
      { sub: user.id, jti, role: user.role },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_EXPIRES_IN',
        ) as StringValue,
      },
    );
  }

  private generateRefreshToken(user: User, jti: string): string {
    return this.jwtService.sign(
      { sub: user.id, jti, role: user.role },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ) as StringValue,
      },
    );
  }

  private async revokeToken(jti: string, userId: string): Promise<void> {
    const ttl = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const ttlMs = ms(ttl as StringValue);
    const expiresAt = new Date(Date.now() + ttlMs);
    await this.revokedTokenRepository.save({ jti, userId, expiresAt });
  }
}
