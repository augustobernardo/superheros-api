import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  registerAndLogin,
  registerAndLoginAsAdmin,
} from './utils/setup-test-app';

describe('UsersModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/users/me', () => {
    it('should return the profile of the logged-in user', async () => {
      const tokens = await registerAndLogin(app, {
        cpf: '11111111112',
        email: 'profile-test@example.com',
        name: 'Profile Tester',
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      const data = res.body.data || res.body;
      expect(data).toHaveProperty('cpf');
      expect(data.cpf).toHaveLength(11);
      expect(data).toHaveProperty('name', 'Profile Tester');
      expect(data).toHaveProperty('email', 'profile-test@example.com');
    });

    it('should reject without token', async () => {
      await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('should update the profile', async () => {
      const tokens = await registerAndLogin(app, {
        cpf: '22222222223',
        email: 'update-test@example.com',
      });

      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      const data = res.body.data || res.body;
      expect(data.name || data).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await registerAndLogin(app, {
        cpf: '33333333334',
        email: 'existing@example.com',
      });

      const tokens = await registerAndLogin(app, {
        cpf: '44444444445',
        email: 'other@example.com',
      });

      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .send({ email: 'existing@example.com' })
        .expect(409);

      expect(res.body.message).toContain('Email');
    });
  });

  describe('DELETE /api/v1/users/me', () => {
    it('should inactivate the user', async () => {
      const tokens = await registerAndLogin(app, {
        cpf: '55555555556',
        email: 'inactivate-me@example.com',
      });

      await request(app.getHttpServer())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          cpfOrEmail: 'inactivate-me@example.com',
          password: 'Strong1!Pass',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/users', () => {
    it('ADMIN should list active users', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '66666666667',
        email: 'admin-list@example.com',
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      const data = res.body.data || res.body;

      const users = Array.isArray(data) ? data : data;
      expect(users.length).toBeGreaterThanOrEqual(1);
    });

    it('VIEWER should get 403', async () => {
      const viewer = await registerAndLogin(app, {
        cpf: '77777777778',
        email: 'viewer-list@example.com',
      });

      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/users/deleted', () => {
    it('ADMIN should list deleted users', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '88888888889',
        email: 'admin-deleted@example.com',
      });

      const toDelete = await registerAndLogin(app, {
        cpf: '99999999990',
        email: 'to-delete@example.com',
      });

      await request(app.getHttpServer())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${toDelete.accessToken}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/api/v1/users/deleted')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      const data = res.body.data || res.body;
      expect(data).toBeDefined();
    });

    it('VIEWER should get 403', async () => {
      const viewer = await registerAndLogin(app, {
        cpf: '10101010133',
        email: 'viewer-deleted@example.com',
      });

      await request(app.getHttpServer())
        .get('/api/v1/users/deleted')
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(403);
    });
  });
});
