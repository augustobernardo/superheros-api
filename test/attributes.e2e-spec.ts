import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  createTestApp,
  registerAndLogin,
  registerAndLoginAsAdmin,
} from './utils/setup-test-app';
import { AttributesModule } from '../src/attributes/attributes.module';
import { Hero } from '../src/heroes/entities/hero.entity';
import { HeroStatus } from '../src/heroes/enums/hero-status.enum';
import { Attribute } from '../src/attributes/entities/attribute.entity';

describe('AttributesModule (e2e)', () => {
  let app: INestApplication;
  let heroRepo: Repository<Hero>;
  let attributeRepo: Repository<Attribute>;

  beforeAll(async () => {
    app = await createTestApp(AttributesModule);
    heroRepo = app.get(getRepositoryToken(Hero));
    attributeRepo = app.get(getRepositoryToken(Attribute));
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

  describe('POST /api/v1/heroes/:heroId/attributes', () => {
    it('ADMIN should create an attribute', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '11111111115',
        email: 'attr-create@example.com',
      });
      const heroId = await createTestHero();

      const res = await request(app.getHttpServer())
        .post(`/api/v1/heroes/${heroId}/attributes`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Strength', value: 90 })
        .expect(201);

      const data = res.body.data || res.body;
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name', 'Strength');
    });

    it('should reject duplicate name', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '22222222226',
        email: 'attr-dup@example.com',
      });
      const heroId = await createTestHero();

      await request(app.getHttpServer())
        .post(`/api/v1/heroes/${heroId}/attributes`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Speed', value: 80 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/heroes/${heroId}/attributes`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Speed', value: 85 })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });

    it('VIEWER should get 403', async () => {
      const viewer = await registerAndLogin(app, {
        cpf: '33333333337',
        email: 'attr-viewer@example.com',
      });
      const heroId = await createTestHero();

      await request(app.getHttpServer())
        .post(`/api/v1/heroes/${heroId}/attributes`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .send({ name: 'Any', value: 50 })
        .expect(403);
    });

    it('should reject attributes on archived hero', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '44444444448',
        email: 'attr-archived@example.com',
      });
      const heroId = await createTestHero();

      await heroRepo.update(heroId, { status: HeroStatus.ARCHIVED });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/heroes/${heroId}/attributes`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'OnArchived', value: 50 })
        .expect(400);

      expect(res.body.message).toContain('archived');
    });
  });

  describe('GET /api/v1/heroes/:heroId/attributes', () => {
    it('should list attributes', async () => {
      const viewer = await registerAndLogin(app, {
        cpf: '55555555559',
        email: 'attr-list@example.com',
      });
      const heroId = await heroRepo.save({
        name: 'Attr List Hero PUBLISHED',
        status: HeroStatus.PUBLISHED,
      }).then((h) => h.id);

      await attributeRepo.save([
        { heroId, name: 'Strength', value: 90 },
        { heroId, name: 'Speed', value: 80 },
      ]);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/heroes/${heroId}/attributes`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(200);

      const data = res.body.data || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PATCH /api/v1/heroes/:heroId/attributes/:id', () => {
    it('should update an attribute', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '66666666660',
        email: 'attr-upd@example.com',
      });
      const heroId = await createTestHero();

      const attr = await attributeRepo.save({ heroId, name: 'Old', value: 10 });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/heroes/${heroId}/attributes/${attr.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'New Name', value: 99 })
        .expect(200);

      const data = res.body.data || res.body;
      expect(data.name).toBe('New Name');
      expect(data.value).toBe(99);
    });
  });

  describe('DELETE /api/v1/heroes/:heroId/attributes/:id', () => {
    it('ADMIN should soft delete an attribute', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '77777777771',
        email: 'attr-del@example.com',
      });
      const heroId = await createTestHero();

      const attr = await attributeRepo.save({
        heroId,
        name: 'ToDelete',
        value: 50,
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/heroes/${heroId}/attributes/${attr.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      const deleted = await attributeRepo.findOne({ where: { id: attr.id } });
      expect(deleted).toBeNull();
    });

    it('EDITOR should get 403', async () => {
      const editor = await registerAndLogin(app, {
        cpf: '88888888882',
        email: 'attr-del-editor@example.com',
      });
      const heroId = await createTestHero();
      const attr = await attributeRepo.save({
        heroId,
        name: 'Safe',
        value: 50,
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/heroes/${heroId}/attributes/${attr.id}`)
        .set('Authorization', `Bearer ${editor.accessToken}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/heroes/:heroId/attributes - validation', () => {
    it('should reject invalid value (< 0)', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '99999999993',
        email: 'attr-val@example.com',
      });
      const heroId = await createTestHero();

      await request(app.getHttpServer())
        .post(`/api/v1/heroes/${heroId}/attributes`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Bad', value: -1 })
        .expect(400);
    });
  });
});
