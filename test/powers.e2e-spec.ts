import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  createTestApp,
  registerAndLogin,
  registerAndLoginAsAdmin,
} from './utils/setup-test-app';
import { PowersModule } from '../src/powers/powers.module';
import { Hero } from '../src/heroes/entities/hero.entity';
import { HeroStatus } from '../src/heroes/enums/hero-status.enum';
import { Power } from '../src/powers/entities/power.entity';

describe('PowersModule (e2e)', () => {
  let app: INestApplication;
  let heroRepo: Repository<Hero>;
  let powerRepo: Repository<Power>;

  beforeAll(async () => {
    app = await createTestApp(PowersModule);
    heroRepo = app.get(getRepositoryToken(Hero));
    powerRepo = app.get(getRepositoryToken(Power));
  });

  afterAll(async () => {
    await app.close();
  });

  let heroCounter = 0;

  async function createTestHero(): Promise<string> {
    heroCounter++;
    const result = await heroRepo.save({
      name: `Test Hero ${heroCounter}`,
      status: HeroStatus.DRAFT,
    });
    return result.id;
  }

  describe('POST /api/v1/heroes/:heroId/powers', () => {
    it('ADMIN should create a power', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '11111111116',
        email: 'pwr-create@example.com',
      });
      const heroId = await createTestHero();

      const res = await request(app.getHttpServer())
        .post(`/api/v1/heroes/${heroId}/powers`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Flight', value: 85 })
        .expect(201);

      const data = res.body.data || res.body;
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name', 'Flight');
    });

    it('should reject duplicate name', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '22222222227',
        email: 'pwr-dup@example.com',
      });
      const heroId = await createTestHero();

      await request(app.getHttpServer())
        .post(`/api/v1/heroes/${heroId}/powers`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Laser', value: 75 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/heroes/${heroId}/powers`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Laser', value: 80 })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('VIEWER should get 403', async () => {
      const viewer = await registerAndLogin(app, {
        cpf: '33333333338',
        email: 'pwr-viewer@example.com',
      });
      const heroId = await createTestHero();

      await request(app.getHttpServer())
        .post(`/api/v1/heroes/${heroId}/powers`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .send({ name: 'Any Power', value: 50 })
        .expect(403);
    });

    it('should reject powers on archived hero', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '44444444449',
        email: 'pwr-archived@example.com',
      });
      const heroId = await createTestHero();

      await heroRepo.update(heroId, { status: HeroStatus.ARCHIVED });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/heroes/${heroId}/powers`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'OnArchived', value: 50 })
        .expect(400);

      expect(res.body.message).toContain('archived');
    });
  });

  describe('GET /api/v1/heroes/:heroId/powers', () => {
    it('should list powers', async () => {
      const viewer = await registerAndLogin(app, {
        cpf: '55555555550',
        email: 'pwr-list@example.com',
      });
      const heroId = await heroRepo.save({
        name: 'Pwr List Hero PUBLISHED',
        status: HeroStatus.PUBLISHED,
      }).then((h) => h.id);

      await powerRepo.save([
        { heroId, name: 'Flight', value: 85 },
        { heroId, name: 'Speed', value: 80 },
      ]);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/heroes/${heroId}/powers`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(200);

      const data = res.body.data || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PATCH /api/v1/heroes/:heroId/powers/:id', () => {
    it('should update a power', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '66666666661',
        email: 'pwr-upd@example.com',
      });
      const heroId = await createTestHero();

      const power = await powerRepo.save({
        heroId,
        name: 'OldPower',
        value: 10,
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/heroes/${heroId}/powers/${power.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'New Power', value: 99 })
        .expect(200);

      const data = res.body.data || res.body;
      expect(data.name).toBe('New Power');
      expect(data.value).toBe(99);
    });
  });

  describe('DELETE /api/v1/heroes/:heroId/powers/:id', () => {
    it('ADMIN should soft delete a power', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '77777777772',
        email: 'pwr-del@example.com',
      });
      const heroId = await createTestHero();

      const power = await powerRepo.save({
        heroId,
        name: 'ToDeletePower',
        value: 50,
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/heroes/${heroId}/powers/${power.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      const deleted = await powerRepo.findOne({ where: { id: power.id } });
      expect(deleted).toBeNull();
    });

    it('EDITOR should get 403', async () => {
      const editor = await registerAndLogin(app, {
        cpf: '88888888883',
        email: 'pwr-del-editor@example.com',
      });
      const heroId = await createTestHero();
      const power = await powerRepo.save({
        heroId,
        name: 'SafePower',
        value: 50,
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/heroes/${heroId}/powers/${power.id}`)
        .set('Authorization', `Bearer ${editor.accessToken}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/heroes/:heroId/powers - validation', () => {
    it('should reject invalid value (> 100)', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '99999999994',
        email: 'pwr-val@example.com',
      });
      const heroId = await createTestHero();

      await request(app.getHttpServer())
        .post(`/api/v1/heroes/${heroId}/powers`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'TooMuch', value: 101 })
        .expect(400);
    });
  });
});
