import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  createTestApp,
  registerAndLogin,
  registerAndLoginAsAdmin,
} from './utils/setup-test-app';
import { HeroesModule } from '../src/heroes/heroes.module';
import { Hero } from '../src/heroes/entities/hero.entity';
import { Publisher } from '../src/heroes/entities/publisher.entity';
import { Alignment } from '../src/heroes/entities/alignment.entity';
import { Attribute } from '../src/attributes/entities/attribute.entity';
import { Power } from '../src/powers/entities/power.entity';
import { HeroStatus } from '../src/heroes/enums/hero-status.enum';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/users/enums/user-role.enum';

describe('HeroesModule (e2e)', () => {
  let app: INestApplication;
  let publisherRepo: Repository<Publisher>;
  let alignmentRepo: Repository<Alignment>;
  let attributeRepo: Repository<Attribute>;
  let powerRepo: Repository<Power>;
  let heroRepo: Repository<Hero>;

  beforeAll(async () => {
    app = await createTestApp(HeroesModule);
    publisherRepo = app.get(getRepositoryToken(Publisher));
    alignmentRepo = app.get(getRepositoryToken(Alignment));
    attributeRepo = app.get(getRepositoryToken(Attribute));
    powerRepo = app.get(getRepositoryToken(Power));
    heroRepo = app.get(getRepositoryToken(Hero));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/heroes', () => {
    it('ADMIN should create a hero as DRAFT', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '11111111113',
        email: 'hero-create-admin@example.com',
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/heroes')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Test Hero' })
        .expect(201);

      const data = res.body.data || res.body;
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('status', HeroStatus.DRAFT);
    });

    it('VIEWER should get 403', async () => {
      const viewer = await registerAndLogin(app, {
        cpf: '22222222224',
        email: 'hero-create-viewer@example.com',
      });

      await request(app.getHttpServer())
        .post('/api/v1/heroes')
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .send({ name: 'Should Not Create' })
        .expect(403);
    });

    it('should reject duplicate name', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '33333333335',
        email: 'hero-dup-admin@example.com',
      });

      await request(app.getHttpServer())
        .post('/api/v1/heroes')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Unique Hero' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/v1/heroes')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Unique Hero' })
        .expect(409);

      expect(res.body.message).toContain('already exists');
    });
  });

  describe('GET /api/v1/heroes', () => {
    it('should list heroes', async () => {
      const viewer = await registerAndLogin(app, {
        cpf: '44444444446',
        email: 'hero-list-viewer@example.com',
      });

      await publisherRepo.save([{ id: 1, name: 'Marvel' }]);
      await alignmentRepo.save([{ id: 1, name: 'Good' }]);

      const heroId = '00000000-0000-0000-0000-000000000001';
      await heroRepo.save({
        id: heroId,
        name: 'Visible Hero',
        status: HeroStatus.PUBLISHED,
        publisherId: 1,
        alignmentId: 1,
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/heroes')
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(200);

      const data = res.body.data || res.body;
      expect(data).toBeDefined();
    });
  });

  describe('PATCH /api/v1/heroes/:id', () => {
    it('should update a hero', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '55555555557',
        email: 'hero-update-admin@example.com',
      });

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/heroes')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Before Update' })
        .expect(201);

      const heroId = (createRes.body.data || createRes.body).id;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/heroes/${heroId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'After Update' })
        .expect(200);

      const data = res.body.data || res.body;
      expect(data).toBeDefined();
    });
  });

  describe('PATCH /api/v1/heroes/:id/publish', () => {
    it('should fail without publisher and alignment', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '66666666668',
        email: 'hero-pub-fail@example.com',
      });

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/heroes')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Incomplete Hero' })
        .expect(201);

      const heroId = (createRes.body.data || createRes.body).id;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/heroes/${heroId}/publish`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(400);

      expect(res.body.message).toBeDefined();
    });

    it('should publish hero with complete data', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '77777777779',
        email: 'hero-pub-success@example.com',
      });

      const [publisher] = await publisherRepo.save([
        { id: 3, name: 'Image Comics' },
      ]);
      const [alignment] = await alignmentRepo.save([
        { id: 3, name: 'Neutral' },
      ]);

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/heroes')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          name: 'Complete Hero',
          publisherId: publisher.id,
          alignmentId: alignment.id,
        })
        .expect(201);

      const heroId = (createRes.body.data || createRes.body).id;

      await attributeRepo.save([
        { heroId, name: 'Strength', value: 90 },
        { heroId, name: 'Speed', value: 80 },
        { heroId, name: 'Intelligence', value: 70 },
      ]);

      await powerRepo.save([
        { heroId, name: 'Flight', value: 85 },
        { heroId, name: 'Laser Vision', value: 75 },
      ]);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/heroes/${heroId}/publish`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      const data = res.body.data || res.body;
      expect(data.status).toBe(HeroStatus.PUBLISHED);
    });
  });

  describe('PATCH /api/v1/heroes/:id/archive', () => {
    it('ADMIN should archive a hero', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '88888888880',
        email: 'hero-archive-admin@example.com',
      });

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/heroes')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'To Archive' })
        .expect(201);

      const heroId = (createRes.body.data || createRes.body).id;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/heroes/${heroId}/archive`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      const data = res.body.data || res.body;
      expect(data.status).toBe(HeroStatus.ARCHIVED);
    });

    it('VIEWER should get 403 on archive', async () => {
      const viewer = await registerAndLogin(app, {
        cpf: '99999999991',
        email: 'hero-archive-viewer@example.com',
      });

      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '10101010133',
        email: 'hero-archive-helper@example.com',
      });

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/heroes')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Protected Hero' })
        .expect(201);

      const heroId = (createRes.body.data || createRes.body).id;

      await request(app.getHttpServer())
        .patch(`/api/v1/heroes/${heroId}/archive`)
        .set('Authorization', `Bearer ${viewer.accessToken}`)
        .expect(403);
    });
  });

  describe('DELETE /api/v1/heroes/:id', () => {
    it('ADMIN should soft delete a hero', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '11111111114',
        email: 'hero-delete-admin@example.com',
      });

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/heroes')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'To Delete' })
        .expect(201);

      const heroId = (createRes.body.data || createRes.body).id;

      await request(app.getHttpServer())
        .delete(`/api/v1/heroes/${heroId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/heroes/${heroId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(404);
    });

    it('EDITOR should get 403', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '22222222225',
        email: 'hero-delete-helper@example.com',
      });

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/heroes')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Editor Protected' })
        .expect(201);

      const heroId = (createRes.body.data || createRes.body).id;

      const editor = await registerAndLogin(app, {
        cpf: '33333333336',
        email: 'hero-delete-editor@example.com',
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/heroes/${heroId}`)
        .set('Authorization', `Bearer ${editor.accessToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/heroes/deleted', () => {
    it('ADMIN should list deleted heroes', async () => {
      const admin = await registerAndLoginAsAdmin(app, {
        cpf: '44444444447',
        email: 'hero-deleted-list@example.com',
      });

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/heroes')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: 'Will Be Deleted' })
        .expect(201);

      const heroId = (createRes.body.data || createRes.body).id;
      await heroRepo.softDelete(heroId);

      const res = await request(app.getHttpServer())
        .get('/api/v1/heroes/deleted')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      const data = res.body.data || res.body;
      expect(data).toBeDefined();
    });
  });
});
