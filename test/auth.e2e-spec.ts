import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, registerAndLogin } from './utils/setup-test-app';

describe('AuthModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          cpf: '12345678909',
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Str0ng!Pass',
        })
        .expect(201);

      expect(res.body.message || res.body.data?.message).toBe(
        'User registered successfully',
      );
    });

    it('should reject duplicate CPF', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          cpf: '99999999999',
          name: 'First User',
          email: 'first@example.com',
          password: 'Str0ng!Pass',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          cpf: '99999999999',
          name: 'Second User',
          email: 'second@example.com',
          password: 'Str0ng!Pass',
        })
        .expect(409);

      expect(res.body.message).toContain('CPF');
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          cpf: '88888888888',
          name: 'First User',
          email: 'dup@example.com',
          password: 'Str0ng!Pass',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          cpf: '77777777777',
          name: 'Second User',
          email: 'dup@example.com',
          password: 'Str0ng!Pass',
        })
        .expect(409);

      expect(res.body.message).toContain('Email');
    });

    it('should reject weak password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          cpf: '66666666666',
          name: 'Weak User',
          email: 'weak@example.com',
          password: 'short',
        })
        .expect(400);

      expect(res.body.message).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const email = 'login-test@example.com';
    const cpf = '55555555555';
    const password = 'Str0ng!Pass';

    beforeAll(async () => {
      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        cpf,
        name: 'Login Test',
        email,
        password,
      });
    });

    it('should login with email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ cpfOrEmail: email, password })
        .expect(200);

      const data = res.body.data || res.body;
      expect(data).toHaveProperty('accessToken');
      expect(data).toHaveProperty('refreshToken');
    });

    it('should login with CPF', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ cpfOrEmail: cpf, password })
        .expect(200);

      const data = res.body.data || res.body;
      expect(data).toHaveProperty('accessToken');
      expect(data).toHaveProperty('refreshToken');
    });

    it('should reject wrong credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ cpfOrEmail: email, password: 'WrongPass1!' })
        .expect(401);

      expect(res.body.message).toBeDefined();
    });

    it('should reject non-existent user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          cpfOrEmail: 'noone@example.com',
          password: 'Str0ng!Pass',
        })
        .expect(401);

      expect(res.body.message).toBeDefined();
    });

    it('should reject inactive user after DELETE /users/me', async () => {
      const tokens = await registerAndLogin(app, {
        cpf: '44444444444',
        email: 'inactive-test@example.com',
      });

      await request(app.getHttpServer())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          cpfOrEmail: 'inactive-test@example.com',
          password: 'Strong1!Pass',
        })
        .expect(401);

      expect(res.body.message).toBeDefined();
    });
  });

  describe('GET /api/v1/auth/validate', () => {
    it('should validate a valid token', async () => {
      const tokens = await registerAndLogin(app, {
        cpf: '33333333333',
        email: 'validate-valid@example.com',
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/validate')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      expect(res.body.valid || res.body.data?.valid).toBe(true);
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/validate')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token', async () => {
      const tokens = await registerAndLogin(app, {
        cpf: '22222222222',
        email: 'refresh-test@example.com',
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(200);

      const data = res.body.data || res.body;
      expect(data).toHaveProperty('accessToken');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should revoke tokens on logout', async () => {
      const tokens = await registerAndLogin(app, {
        cpf: '12121212108',
        email: 'logout-test@example.com',
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      const data = res.body.data || res.body;
      expect(data.message || data).toBe('Logged out successfully');
    });
  });
});
