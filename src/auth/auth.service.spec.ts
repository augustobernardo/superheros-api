import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { RevokedToken } from './entities/revoked-token.entity';
import { LoggingService } from '../logging/logging.service';

jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Record<string, jest.Mock>;
  let revokedTokenRepository: Record<string, jest.Mock>;

  const mockUser = {
    id: 'user-1',
    cpf: '12345678901',
    name: 'John Doe',
    email: 'john@example.com',
    passwordHash: '',
    role: 'VIEWER',
    isActive: true,
    deletedAt: null,
  };

  beforeEach(async () => {
    mockUser.passwordHash = await bcrypt.hash('Str0ng!Pass', 1);

    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    revokedTokenRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(RevokedToken), useValue: revokedTokenRepository },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock-token'), decode: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                JWT_SECRET: 'test-secret',
                JWT_EXPIRES_IN: '15m',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_REFRESH_EXPIRES_IN: '7d',
              };
              return config[key];
            }),
          },
        },
        {
          provide: LoggingService,
          useValue: { info: jest.fn(), warning: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.register({
        cpf: '12345678901',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Str0ng!Pass',
      });

      expect(result).toEqual({ message: 'User registered successfully' });
    });

    it('should throw ConflictException when CPF is taken', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({
          cpf: '12345678901',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Str0ng!Pass',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when email is taken', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);

      await expect(
        service.register({
          cpf: '12345678901',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Str0ng!Pass',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.login({
        cpfOrEmail: 'john@example.com',
        password: 'Str0ng!Pass',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          cpfOrEmail: 'wrong@example.com',
          password: 'wrong',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.login({
          cpfOrEmail: 'john@example.com',
          password: 'wrong',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(
        service.login({
          cpfOrEmail: 'john@example.com',
          password: 'Str0ng!Pass',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke token and return success', async () => {
      revokedTokenRepository.save.mockResolvedValue({});

      const result = await service.logout('user-1', 'jti-1');

      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('inactivate', () => {
    it('should soft delete user and revoke tokens', async () => {
      revokedTokenRepository.save.mockResolvedValue({});
      userRepository.softDelete.mockResolvedValue({});

      const result = await service.inactivate('user-1', 'jti-1');

      expect(result).toEqual({ message: 'User inactivated successfully' });
    });
  });
});
