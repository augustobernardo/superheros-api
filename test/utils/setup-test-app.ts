import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';

import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { LoggingModule } from '../../src/logging/logging.module';
import { AuthModule } from '../../src/auth/auth.module';
import { UsersModule } from '../../src/users/users.module';
import { User } from '../../src/users/entities/user.entity';
import { RevokedToken } from '../../src/auth/entities/revoked-token.entity';
import { Hero } from '../../src/heroes/entities/hero.entity';
import { Publisher } from '../../src/heroes/entities/publisher.entity';
import { Alignment } from '../../src/heroes/entities/alignment.entity';
import { Attribute } from '../../src/attributes/entities/attribute.entity';
import { Power } from '../../src/powers/entities/power.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../src/users/enums/user-role.enum';
import request from 'supertest';

let cpfCounter = 0;

function makeValidCpf(input: string): string {
  cpfCounter++;
  const digits = String(cpfCounter)
    .padStart(9, '0')
    .slice(-9)
    .split('')
    .map(Number);
  const calcCheck = (b: number[]) => {
    const sum = b.reduce((acc, d, i) => acc + d * (b.length + 1 - i), 0);
    const rem = (sum * 10) % 11;
    return rem === 10 ? 0 : rem;
  };
  digits.push(calcCheck(digits));
  digits.push(calcCheck(digits));
  return digits.join('');
}

const TEST_JWT_SECRET = 'test-jwt-secret-32-characters-long!!';
const TEST_REFRESH_SECRET = 'test-refresh-secret-32-characters-long!!';

export async function createTestApp(
  moduleUnderTest?: any,
): Promise<INestApplication> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: ':memory:',
        entities: [
          User,
          RevokedToken,
          Hero,
          Publisher,
          Alignment,
          Attribute,
          Power,
        ],
        synchronize: true,
      }),
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: [
          () => ({
            JWT_SECRET: TEST_JWT_SECRET,
            JWT_REFRESH_SECRET: TEST_REFRESH_SECRET,
            JWT_EXPIRES_IN: '15m',
            JWT_REFRESH_EXPIRES_IN: '7d',
          }),
        ],
      }),
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({ secret: TEST_JWT_SECRET }),
      TypeOrmModule.forFeature([
        User,
        RevokedToken,
        Hero,
        Publisher,
        Alignment,
        Attribute,
        Power,
      ]),
      LoggingModule,
      AuthModule,
      UsersModule,
      ...(moduleUnderTest ? [moduleUnderTest] : []),
    ],
    providers: [
      { provide: APP_GUARD, useClass: JwtAuthGuard },
      { provide: APP_GUARD, useClass: RolesGuard },
    ],
  })
    .overrideProvider(getModelToken('Log'))
    .useValue({
      create: jest.fn(),
      find: jest.fn(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn(),
    })
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      validationError: { target: false },
    }),
  );
  await app.init();
  return app;
}

export async function registerAndLogin(
  app: INestApplication,
  overrides?: {
    cpf?: string;
    email?: string;
    name?: string;
    password?: string;
  },
): Promise<{ accessToken: string; refreshToken: string }> {
  const server = app.getHttpServer();

  const rawCpf = overrides?.cpf || '11111111111';
  const cpf = makeValidCpf(rawCpf);
  const email = overrides?.email || 'test@example.com';

  await request(server)
    .post('/api/v1/auth/register')
    .send({
      cpf,
      name: overrides?.name || 'Test User',
      email,
      password: overrides?.password || 'Str0ng!Pass',
    });

  const loginRes = await request(server)
    .post('/api/v1/auth/login')
    .send({
      cpfOrEmail: email,
      password: overrides?.password || 'Str0ng!Pass',
    });

  const data = loginRes.body.data || loginRes.body;
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

export async function registerAndLoginAsAdmin(
  app: INestApplication,
  overrides?: {
    cpf?: string;
    email?: string;
    name?: string;
    password?: string;
  },
): Promise<{ accessToken: string; refreshToken: string }> {
  const cpf = overrides?.cpf || '00000000000';
  const email = overrides?.email || 'admin@example.com';

  await registerAndLogin(app, {
    cpf,
    email,
    name: overrides?.name || 'Admin',
    password: overrides?.password,
  });

  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const user = await userRepo.findOne({ where: { email } });
  if (user) {
    user.role = UserRole.ADMIN;
    await userRepo.save(user);
  }

  const server = app.getHttpServer();
  const loginRes = await request(server)
    .post('/api/v1/auth/login')
    .send({
      cpfOrEmail: email,
      password: overrides?.password || 'Str0ng!Pass',
    });

  const data = loginRes.body.data || loginRes.body;
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}
