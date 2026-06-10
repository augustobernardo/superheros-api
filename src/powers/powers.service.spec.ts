import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PowersService } from './powers.service';
import { Power } from './entities/power.entity';
import { HeroesService } from '../heroes/heroes.service';
import { HeroStatus } from '../heroes/enums/hero-status.enum';
import { LoggingService } from '../logging/logging.service';

describe('PowersService', () => {
  let service: PowersService;
  let powerRepository: Record<string, jest.Mock>;
  let heroesService: Record<string, jest.Mock>;

  const mockHero = {
    id: 'hero-1',
    name: 'Test Hero',
    status: HeroStatus.DRAFT,
  };

  const mockPower = {
    id: 'power-1',
    heroId: 'hero-1',
    name: 'Flight',
    value: 90,
    deletedAt: null,
  };

  beforeEach(async () => {
    powerRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      count: jest.fn(),
    };

    heroesService = {
      assertHeroExists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PowersService,
        { provide: getRepositoryToken(Power), useValue: powerRepository },
        { provide: HeroesService, useValue: heroesService },
        {
          provide: LoggingService,
          useValue: { info: jest.fn(), warning: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PowersService>(PowersService);
  });

  describe('findAll', () => {
    it('should return powers for a published hero to VIEWER', async () => {
      heroesService.assertHeroExists.mockResolvedValue({
        ...mockHero,
        status: HeroStatus.PUBLISHED,
      });
      powerRepository.find.mockResolvedValue([mockPower]);

      const result = await service.findAll('hero-1', 'VIEWER');
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException for VIEWER on non-published hero', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);

      await expect(service.findAll('hero-1', 'VIEWER')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return powers for ADMIN regardless of status', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);
      powerRepository.find.mockResolvedValue([mockPower]);

      const result = await service.findAll('hero-1', 'ADMIN');
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create a power', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);
      powerRepository.findOne.mockResolvedValue(null);
      powerRepository.create.mockReturnValue(mockPower);
      powerRepository.save.mockResolvedValue(mockPower);

      const result = await service.create(
        'hero-1',
        { name: 'Flight', value: 90 },
        'user-1',
      );
      expect(result.name).toBe('Flight');
    });

    it('should throw BadRequestException for archived hero', async () => {
      heroesService.assertHeroExists.mockResolvedValue({
        ...mockHero,
        status: HeroStatus.ARCHIVED,
      });

      await expect(
        service.create('hero-1', { name: 'Flight', value: 90 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for duplicate power', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);
      powerRepository.findOne.mockResolvedValue(mockPower);

      await expect(
        service.create('hero-1', { name: 'Flight', value: 90 }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should restore a soft-deleted power with same name', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);
      powerRepository.findOne.mockResolvedValue({
        ...mockPower,
        deletedAt: new Date(),
      });
      powerRepository.restore.mockResolvedValue({});
      powerRepository.save.mockResolvedValue(mockPower);

      const result = await service.create(
        'hero-1',
        { name: 'Flight', value: 90 },
        'user-1',
      );
      expect(powerRepository.restore).toHaveBeenCalledWith('power-1');
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update a power', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);
      powerRepository.findOne.mockResolvedValue(mockPower);
      powerRepository.save.mockResolvedValue({ ...mockPower, value: 95 });

      const result = await service.update(
        'hero-1',
        'power-1',
        { value: 95 },
        'user-1',
      );
      expect(result.value).toBe(95);
    });

    it('should throw ConflictException on duplicate name during update', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);
      powerRepository.findOne
        .mockResolvedValueOnce(mockPower)
        .mockResolvedValueOnce({
          ...mockPower,
          id: 'other-power',
          name: 'Super Strength',
        });

      await expect(
        service.update(
          'hero-1',
          'power-1',
          { name: 'Super Strength' },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft delete a power', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);
      powerRepository.findOne.mockResolvedValue(mockPower);
      powerRepository.softDelete.mockResolvedValue({});

      const result = await service.remove('hero-1', 'power-1', 'user-1');
      expect(result).toEqual({ message: 'Power deleted successfully' });
    });
  });
});
