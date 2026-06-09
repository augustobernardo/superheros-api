import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createTestApp, registerAndLogin } from './utils/setup-test-app';
import { BattlesModule } from '../src/battles/battles.module';
import { Hero } from '../src/heroes/entities/hero.entity';
import { Publisher } from '../src/heroes/entities/publisher.entity';
import { Alignment } from '../src/heroes/entities/alignment.entity';
import { Attribute } from '../src/attributes/entities/attribute.entity';
import { Power } from '../src/powers/entities/power.entity';
import { HeroStatus } from '../src/heroes/enums/hero-status.enum';

describe('BattlesModule (e2e)', () => {
  let app: INestApplication;
  let heroRepo: Repository<Hero>;
  let publisherRepo: Repository<Publisher>;
  let alignmentRepo: Repository<Alignment>;
  let attributeRepo: Repository<Attribute>;
  let powerRepo: Repository<Power>;

  beforeAll(async () => {
    app = await createTestApp(BattlesModule);
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

  it('should reject same publisher battle', async () => {
    const viewer = await registerAndLogin(app, {
      cpf: '11111111118',
      email: 'battle-same@example.com',
    });

    const [publisher] = await publisherRepo.save([
      { id: 8, name: 'Solo Publisher' },
    ]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/battles')
      .query({ publisherAId: publisher.id, publisherBId: publisher.id })
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(400);

    expect(res.body.message).toContain('different');
  });

  it('should battle between two publishers', async () => {
    const viewer = await registerAndLogin(app, {
      cpf: '22222222229',
      email: 'battle-fight@example.com',
    });

    const [pubA] = await publisherRepo.save([{ id: 9, name: 'Marvel' }]);
    const [pubB] = await publisherRepo.save([{ id: 10, name: 'DC' }]);
    const [alignment] = await alignmentRepo.save([{ id: 8, name: 'Good2' }]);

    const heroA1 = await heroRepo.save({
      name: 'Hero A1',
      status: HeroStatus.PUBLISHED,
      publisherId: pubA.id,
      alignmentId: alignment.id,
    });
    const heroA2 = await heroRepo.save({
      name: 'Hero A2',
      status: HeroStatus.PUBLISHED,
      publisherId: pubA.id,
      alignmentId: alignment.id,
    });
    const heroB1 = await heroRepo.save({
      name: 'Hero B1',
      status: HeroStatus.PUBLISHED,
      publisherId: pubB.id,
      alignmentId: alignment.id,
    });

    await attributeRepo.save([
      { heroId: heroA1.id, name: 'Strength', value: 90 },
      { heroId: heroA1.id, name: 'Speed', value: 80 },
    ]);
    await powerRepo.save([{ heroId: heroA1.id, name: 'Flight', value: 85 }]);

    await attributeRepo.save([
      { heroId: heroA2.id, name: 'Strength', value: 70 },
    ]);
    await powerRepo.save([{ heroId: heroA2.id, name: 'Flight', value: 95 }]);

    await attributeRepo.save([
      { heroId: heroB1.id, name: 'Strength', value: 85 },
      { heroId: heroB1.id, name: 'Speed', value: 60 },
    ]);
    await powerRepo.save([{ heroId: heroB1.id, name: 'Flight', value: 80 }]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/battles')
      .query({ publisherAId: pubA.id, publisherBId: pubB.id })
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('publisherA', 'Marvel');
    expect(res.body).toHaveProperty('publisherB', 'DC');
    expect(res.body).toHaveProperty('matchResults');
    expect(res.body).toHaveProperty('overallWinner');
    expect(res.body).toHaveProperty('meta');
    expect(Array.isArray(res.body.matchResults)).toBe(true);
    expect(res.body.matchResults.length).toBeGreaterThanOrEqual(1);
  });

  it('should paginate match results', async () => {
    const viewer = await registerAndLogin(app, {
      cpf: '33333333330',
      email: 'battle-pag@example.com',
    });

    const [pubA] = await publisherRepo.save([{ id: 11, name: 'Publisher X' }]);
    const [pubB] = await publisherRepo.save([{ id: 12, name: 'Publisher Y' }]);
    const [alignment] = await alignmentRepo.save([{ id: 9, name: 'Evil2' }]);

    for (let i = 0; i < 3; i++) {
      const heroA = await heroRepo.save({
        name: `PaginatedA ${i}`,
        status: HeroStatus.PUBLISHED,
        publisherId: pubA.id,
        alignmentId: alignment.id,
      });
      const heroB = await heroRepo.save({
        name: `PaginatedB ${i}`,
        status: HeroStatus.PUBLISHED,
        publisherId: pubB.id,
        alignmentId: alignment.id,
      });

      await attributeRepo.save([
        { heroId: heroA.id, name: 'Strength', value: 80 },
      ]);
      await attributeRepo.save([
        { heroId: heroB.id, name: 'Strength', value: 80 },
      ]);
    }

    const res = await request(app.getHttpServer())
      .get('/api/v1/battles')
      .query({
        publisherAId: pubA.id,
        publisherBId: pubB.id,
        page: 1,
        limit: 2,
      })
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    expect(res.body.matchResults.length).toBeLessThanOrEqual(2);
    expect(res.body.meta.total).toBe(9);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(2);
  });
});
