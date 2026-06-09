import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import type { StringValue } from 'ms';
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
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    await this.assertCpfNotTaken(dto.cpf);
    await this.assertEmailNotTaken(dto.email);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      cpf: dto.cpf,
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    await this.userRepository.save(user);
    await this.loggingService.info('User registered', { userId: user.id });

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
    await this.revokeAllUserTokens(userId);
    await this.loggingService.info('User logged out', { userId });

    return { message: 'Logged out successfully' };
  }

  async refresh(payload: JwtPayload): Promise<{ accessToken: string }> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    this.assertUserIsActive(user);

    const jti = uuidv4();
    const accessToken = this.generateAccessToken(user, jti);

    return { accessToken };
  }

  validateToken(user: AuthenticatedUser): {
    valid: boolean;
    user: AuthenticatedUser;
  } {
    return { valid: true, user };
  }

  async inactivate(userId: string, jti: string): Promise<{ message: string }> {
    await this.revokeToken(jti, userId);
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

  private async revokeAllUserTokens(userId: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.revokedTokenRepository.save({
      jti: uuidv4(),
      userId,
      expiresAt,
    });
  }

  private async revokeToken(jti: string, userId: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.revokedTokenRepository.save({ jti, userId, expiresAt });
  }
}
