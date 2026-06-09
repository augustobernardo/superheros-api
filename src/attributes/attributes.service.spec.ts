import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { AttributesService } from './attributes.service';
import { Attribute } from './entities/attribute.entity';
import { HeroesService } from '../heroes/heroes.service';
import { HeroStatus } from '../heroes/enums/hero-status.enum';
import { LoggingService } from '../logging/logging.service';

describe('AttributesService', () => {
  let service: AttributesService;
  let attributeRepository: Record<string, jest.Mock>;
  let heroesService: Record<string, jest.Mock>;

  const mockHero = {
    id: 'hero-1',
    name: 'Test Hero',
    status: HeroStatus.DRAFT,
  };

  const mockAttribute = {
    id: 'attr-1',
    heroId: 'hero-1',
    name: 'Strength',
    value: 85,
    deletedAt: null,
  };

  beforeEach(async () => {
    attributeRepository = {
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
        AttributesService,
        {
          provide: getRepositoryToken(Attribute),
          useValue: attributeRepository,
        },
        { provide: HeroesService, useValue: heroesService },
        {
          provide: LoggingService,
          useValue: { info: jest.fn(), warning: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AttributesService>(AttributesService);
  });

  describe('findAll', () => {
    it('should return attributes for a published hero to VIEWER', async () => {
      heroesService.assertHeroExists.mockResolvedValue({
        ...mockHero,
        status: HeroStatus.PUBLISHED,
      });
      attributeRepository.find.mockResolvedValue([mockAttribute]);

      const result = await service.findAll('hero-1', 'VIEWER');
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException for VIEWER on non-published hero', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);

      await expect(service.findAll('hero-1', 'VIEWER')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return attributes for ADMIN regardless of status', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);
      attributeRepository.find.mockResolvedValue([mockAttribute]);

      const result = await service.findAll('hero-1', 'ADMIN');
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create an attribute', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);
      attributeRepository.findOne.mockResolvedValue(null);
      attributeRepository.create.mockReturnValue(mockAttribute);
      attributeRepository.save.mockResolvedValue(mockAttribute);

      const result = await service.create(
        'hero-1',
        { name: 'Strength', value: 85 },
        'user-1',
      );
      expect(result.name).toBe('Strength');
    });

    it('should throw BadRequestException for archived hero', async () => {
      heroesService.assertHeroExists.mockResolvedValue({
        ...mockHero,
        status: HeroStatus.ARCHIVED,
      });

      await expect(
        service.create('hero-1', { name: 'Strength', value: 85 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for duplicate attribute', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);
      attributeRepository.findOne.mockResolvedValue(mockAttribute);

      await expect(
        service.create('hero-1', { name: 'Strength', value: 85 }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should restore a soft-deleted attribute with same name', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);
      attributeRepository.findOne.mockResolvedValue({
        ...mockAttribute,
        deletedAt: new Date(),
      });
      attributeRepository.restore.mockResolvedValue({});
      attributeRepository.save.mockResolvedValue(mockAttribute);

      const result = await service.create(
        'hero-1',
        { name: 'Strength', value: 85 },
        'user-1',
      );
      expect(attributeRepository.restore).toHaveBeenCalledWith('attr-1');
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update an attribute', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);
      attributeRepository.findOne.mockResolvedValue(mockAttribute);
      attributeRepository.save.mockResolvedValue({
        ...mockAttribute,
        value: 90,
      });

      const result = await service.update(
        'hero-1',
        'attr-1',
        { value: 90 },
        'user-1',
      );
      expect(result.value).toBe(90);
    });

    it('should throw ConflictException on duplicate name during update', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);
      attributeRepository.findOne
        .mockResolvedValueOnce(mockAttribute)
        .mockResolvedValueOnce({
          ...mockAttribute,
          id: 'other-attr',
          name: 'Agility',
        });

      await expect(
        service.update('hero-1', 'attr-1', { name: 'Agility' }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft delete an attribute', async () => {
      heroesService.assertHeroExists.mockResolvedValue(mockHero);
      attributeRepository.findOne.mockResolvedValue(mockAttribute);
      attributeRepository.softDelete.mockResolvedValue({});

      const result = await service.remove('hero-1', 'attr-1', 'user-1');
      expect(result).toEqual({ message: 'Attribute deleted successfully' });
    });
  });
});
