import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';

import { BattlesService } from './battles.service';
import { Hero } from '../heroes/entities/hero.entity';
import { Attribute } from '../attributes/entities/attribute.entity';
import { Power } from '../powers/entities/power.entity';
import { HeroStatus } from '../heroes/enums/hero-status.enum';

describe('BattlesService', () => {
  let service: BattlesService;
  let heroRepository: Record<string, jest.Mock>;
  let attributeRepository: Record<string, jest.Mock>;
  let powerRepository: Record<string, jest.Mock>;

  const mockPublisherA = { id: 1, name: 'Marvel' };
  const mockPublisherB = { id: 2, name: 'DC' };

  const mockHeroA = {
    id: 'hero-a',
    name: 'Iron Man',
    status: HeroStatus.PUBLISHED,
    publisherId: 1,
    publisher: mockPublisherA,
  };

  const mockHeroB = {
    id: 'hero-b',
    name: 'Superman',
    status: HeroStatus.PUBLISHED,
    publisherId: 2,
    publisher: mockPublisherB,
  };

  beforeEach(async () => {
    heroRepository = { find: jest.fn() };
    attributeRepository = { find: jest.fn() };
    powerRepository = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BattlesService,
        { provide: getRepositoryToken(Hero), useValue: heroRepository },
        {
          provide: getRepositoryToken(Attribute),
          useValue: attributeRepository,
        },
        { provide: getRepositoryToken(Power), useValue: powerRepository },
      ],
    }).compile();

    service = module.get<BattlesService>(BattlesService);
  });

  describe('battle', () => {
    it('should throw if publishers are the same', async () => {
      await expect(service.battle(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw if no PUBLISHED heroes in publisher A', async () => {
      heroRepository.find.mockResolvedValueOnce([]);

      await expect(service.battle(1, 2)).rejects.toThrow(BadRequestException);
    });

    it('should throw if no PUBLISHED heroes in publisher B', async () => {
      heroRepository.find
        .mockResolvedValueOnce([mockHeroA])
        .mockResolvedValueOnce([]);

      await expect(service.battle(1, 2)).rejects.toThrow(BadRequestException);
    });

    it('should return correct battle result with 3 levels', async () => {
      heroRepository.find
        .mockResolvedValueOnce([mockHeroA])
        .mockResolvedValueOnce([mockHeroB]);

      attributeRepository.find
        .mockResolvedValueOnce([
          { heroId: 'hero-a', name: 'Strength', value: 80 },
          { heroId: 'hero-a', name: 'Speed', value: 70 },
        ])
        .mockResolvedValueOnce([
          { heroId: 'hero-b', name: 'Strength', value: 95 },
          { heroId: 'hero-b', name: 'Speed', value: 60 },
        ]);

      powerRepository.find
        .mockResolvedValueOnce([
          { heroId: 'hero-a', name: 'Flight', value: 85 },
        ])
        .mockResolvedValueOnce([
          { heroId: 'hero-b', name: 'Flight', value: 90 },
        ]);

      const result = await service.battle(1, 2);

      expect(result).toHaveProperty('publisherA', 'Marvel');
      expect(result).toHaveProperty('publisherB', 'DC');
      expect(result).toHaveProperty('overallWinner');
      expect(result).toHaveProperty('matchResults');
      expect(result).toHaveProperty('meta');

      expect(result.matchResults).toHaveLength(1);

      const match = result.matchResults[0];
      expect(match).toHaveProperty('heroA.name', 'Iron Man');
      expect(match).toHaveProperty('heroB.name', 'Superman');
      expect(match).toHaveProperty('rounds');
      expect(match.rounds).toHaveLength(3);

      const strengthRound = match.rounds.find((r) => r.itemName === 'Strength');
      expect(strengthRound).toBeDefined();
      expect(strengthRound!.winner).toBe('B');

      const speedRound = match.rounds.find((r) => r.itemName === 'Speed');
      expect(speedRound).toBeDefined();
      expect(speedRound!.winner).toBe('A');
    });

    it('should handle draws correctly', async () => {
      heroRepository.find
        .mockResolvedValueOnce([mockHeroA])
        .mockResolvedValueOnce([mockHeroB]);

      attributeRepository.find
        .mockResolvedValueOnce([
          { heroId: 'hero-a', name: 'Strength', value: 50 },
        ])
        .mockResolvedValueOnce([
          { heroId: 'hero-b', name: 'Strength', value: 50 },
        ]);

      powerRepository.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await service.battle(1, 2);
      const match = result.matchResults[0];

      expect(match.winner).toBeNull();
      expect(match.draws).toBe(1);
    });
  });
});
