import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createTestApp, registerAndLogin } from './utils/setup-test-app';
import { ReportsModule } from '../src/reports/reports.module';
import { Hero } from '../src/heroes/entities/hero.entity';
import { Publisher } from '../src/heroes/entities/publisher.entity';
import { Alignment } from '../src/heroes/entities/alignment.entity';
import { Attribute } from '../src/attributes/entities/attribute.entity';
import { Power } from '../src/powers/entities/power.entity';
import { HeroStatus } from '../src/heroes/enums/hero-status.enum';

describe('ReportsModule (e2e)', () => {
  let app: INestApplication;
  let heroRepo: Repository<Hero>;
  let publisherRepo: Repository<Publisher>;
  let alignmentRepo: Repository<Alignment>;
  let attributeRepo: Repository<Attribute>;
  let powerRepo: Repository<Power>;

  beforeAll(async () => {
    app = await createTestApp(ReportsModule);
    heroRepo = app.get(getRepositoryToken(Hero));
    publisherRepo = app.get(getRepositoryToken(Publisher));
    alignmentRepo = app.get(getRepositoryToken(Alignment));
    attributeRepo = app.get(getRepositoryToken(Attribute));
    powerRepo = app.get(getRepositoryToken(Power));
  });

  beforeEach(async () => {
    await powerRepo.query('DELETE FROM powers');
    await attributeRepo.query('DELETE FROM attributes');
    await heroRepo.query('DELETE FROM heroes');
    await alignmentRepo.query('DELETE FROM alignments');
    await publisherRepo.query('DELETE FROM publishers');
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/reports/heroes should return empty report', async () => {
    const viewer = await registerAndLogin(app, {
      cpf: '11111111117',
      email: 'report-empty@example.com',
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/reports/heroes')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('GET /api/v1/reports/heroes should return published heroes', async () => {
    const viewer = await registerAndLogin(app, {
      cpf: '22222222228',
      email: 'report-heroes@example.com',
    });

    const [publisher] = await publisherRepo.save([
      { id: 4, name: 'Dark Horse' },
    ]);
    const [alignment] = await alignmentRepo.save([
      { id: 4, name: 'LawfulGood' },
    ]);

    const heroA = await heroRepo.save({
      name: 'Alpha Hero',
      status: HeroStatus.PUBLISHED,
      publisherId: publisher.id,
      alignmentId: alignment.id,
    });
    const heroB = await heroRepo.save({
      name: 'Beta Hero',
      status: HeroStatus.PUBLISHED,
      publisherId: publisher.id,
      alignmentId: alignment.id,
    });

    await attributeRepo.save([
      { heroId: heroA.id, name: 'Strength', value: 100 },
    ]);
    await powerRepo.save([{ heroId: heroB.id, name: 'Flight', value: 90 }]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/reports/heroes')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(res.body.total).toBe(2);
    expect(res.body.data).toHaveLength(2);
  });

  it('GET /api/v1/reports/heroes should sort by power sum', async () => {
    const viewer = await registerAndLogin(app, {
      cpf: '33333333339',
      email: 'report-sort@example.com',
    });

    const [publisher] = await publisherRepo.save([{ id: 5, name: 'Valiant' }]);
    const [alignment] = await alignmentRepo.save([
      { id: 5, name: 'NeutralEvil' },
    ]);

    const heroLow = await heroRepo.save({
      name: 'Low Power',
      status: HeroStatus.PUBLISHED,
      publisherId: publisher.id,
      alignmentId: alignment.id,
    });
    const heroHigh = await heroRepo.save({
      name: 'High Power',
      status: HeroStatus.PUBLISHED,
      publisherId: publisher.id,
      alignmentId: alignment.id,
    });

    await powerRepo.save([{ heroId: heroLow.id, name: 'Weak', value: 10 }]);
    await powerRepo.save([{ heroId: heroHigh.id, name: 'Strong', value: 100 }]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/reports/heroes')
      .query({ orderBy: 'powers', order: 'DESC' })
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(res.body.data[0].name).toBe('High Power');
  });

  it('should not include DRAFT heroes', async () => {
    const viewer = await registerAndLogin(app, {
      cpf: '44444444440',
      email: 'report-draft@example.com',
    });

    const [publisher] = await publisherRepo.save([{ id: 6, name: 'Boom' }]);
    const [alignment] = await alignmentRepo.save([{ id: 6, name: 'Chaotic' }]);

    await heroRepo.save({
      name: 'Draft Hero',
      status: HeroStatus.DRAFT,
      publisherId: publisher.id,
      alignmentId: alignment.id,
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/reports/heroes')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(res.body.total).toBe(0);
  });

  it('should paginate results', async () => {
    const viewer = await registerAndLogin(app, {
      cpf: '55555555551',
      email: 'report-pag@example.com',
    });

    const [publisher] = await publisherRepo.save([{ id: 7, name: 'IDW' }]);
    const [alignment] = await alignmentRepo.save([
      { id: 7, name: 'TrueNeutral' },
    ]);

    for (let i = 0; i < 5; i++) {
      await heroRepo.save({
        name: `Paginated Hero ${i}`,
        status: HeroStatus.PUBLISHED,
        publisherId: publisher.id,
        alignmentId: alignment.id,
      });
    }

    const res = await request(app.getHttpServer())
      .get('/api/v1/reports/heroes')
      .query({ page: 1, limit: 2 })
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(5);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
  });
});
