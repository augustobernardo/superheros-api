import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderBy, Order } from './dto/hero-report-filter.dto';
import { ReportsService } from './reports.service';
import { Hero } from '../heroes/entities/hero.entity';
import { Attribute } from '../attributes/entities/attribute.entity';
import { Power } from '../powers/entities/power.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let mockHeroRepository: Record<string, jest.Mock>;

  function createMockQuery() {
    const mockSubQuery = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
    };

    return {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockImplementation(function (
        this: any,
        first: unknown,
        ...rest: unknown[]
      ) {
        if (typeof first === 'function' && first.length > 0) {
          (first as (qb: typeof mockSubQuery) => void)(mockSubQuery);
        }
        return this;
      }),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(10),
      getMany: jest.fn().mockResolvedValue([]),
    };
  }

  beforeEach(async () => {
    mockHeroRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(createMockQuery()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Hero),
          useValue: mockHeroRepository,
        },
        {
          provide: getRepositoryToken(Attribute),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Power),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a query builder', async () => {
    const result = await service.getHeroesReport({});
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('limit');
  });

  it('should apply filters', async () => {
    mockHeroRepository.createQueryBuilder.mockReturnValue(createMockQuery());

    const result = await service.getHeroesReport({
      publisher: 'Marvel',
      alignment: 'Good',
      attribute: 'Strength',
      power: 'Flight',
      orderBy: OrderBy.POWERS,
      order: Order.DESC,
      page: 2,
      limit: 5,
    });
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total', 10);
    expect(result).toHaveProperty('page', 2);
    expect(result).toHaveProperty('limit', 5);
  });
});
