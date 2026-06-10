import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { HeroesService } from './heroes.service';
import { Hero } from './entities/hero.entity';
import { Publisher } from './entities/publisher.entity';
import { Alignment } from './entities/alignment.entity';
import { Attribute } from '../attributes/entities/attribute.entity';
import { Power } from '../powers/entities/power.entity';
import { LoggingService } from '../logging/logging.service';
import { HeroStatus } from './enums/hero-status.enum';

describe('HeroesService', () => {
  let service: HeroesService;
  let heroRepository: Record<string, jest.Mock>;
  let publisherRepository: Record<string, jest.Mock>;
  let alignmentRepository: Record<string, jest.Mock>;
  let attributeRepository: Record<string, jest.Mock>;
  let powerRepository: Record<string, jest.Mock>;
  let mockManager: Record<string, jest.Mock>;

  const mockHero = {
    id: 'hero-1',
    name: 'Test Hero',
    status: HeroStatus.DRAFT,
    publisherId: 1,
    alignmentId: 1,
    deletedAt: null,
  };

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
    };

    heroRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: {
        transaction: jest
          .fn()
          .mockImplementation(async (cb) => cb(mockManager)),
      },
    };

    publisherRepository = { findOne: jest.fn() };
    alignmentRepository = { findOne: jest.fn() };
    attributeRepository = { count: jest.fn(), find: jest.fn() };
    powerRepository = { count: jest.fn(), find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HeroesService,
        { provide: getRepositoryToken(Hero), useValue: heroRepository },
        {
          provide: getRepositoryToken(Publisher),
          useValue: publisherRepository,
        },
        {
          provide: getRepositoryToken(Alignment),
          useValue: alignmentRepository,
        },
        {
          provide: getRepositoryToken(Attribute),
          useValue: attributeRepository,
        },
        { provide: getRepositoryToken(Power), useValue: powerRepository },
        {
          provide: LoggingService,
          useValue: { info: jest.fn(), warning: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<HeroesService>(HeroesService);
  });

  describe('create', () => {
    it('should create a hero as DRAFT', async () => {
      heroRepository.findOne
        .mockResolvedValueOnce(null) // duplicate name check
        .mockResolvedValueOnce(mockHero); // final load with relations
      publisherRepository.findOne.mockResolvedValue({ id: 1 });
      alignmentRepository.findOne.mockResolvedValue({ id: 1 });
      heroRepository.create.mockReturnValue(mockHero);
      heroRepository.save.mockResolvedValue(mockHero);

      const result = await service.create(
        { name: 'Test Hero', publisherId: 1, alignmentId: 1 },
        'user-1',
      );

      expect(result).toBeDefined();
      expect(heroRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: HeroStatus.DRAFT }),
      );
    });

    it('should throw ConflictException on duplicate name', async () => {
      heroRepository.findOne.mockResolvedValue(mockHero);

      await expect(
        service.create({ name: 'Test Hero' }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('publish', () => {
    it('should publish a hero with valid requirements', async () => {
      mockManager.findOne.mockResolvedValueOnce({
        ...mockHero,
        publisherId: 1,
        alignmentId: 1,
      });
      mockManager.count.mockResolvedValueOnce(3);
      mockManager.count.mockResolvedValueOnce(2);
      mockManager.save.mockResolvedValue({
        ...mockHero,
        status: HeroStatus.PUBLISHED,
      });

      const result = await service.publish('hero-1', 'user-1');

      expect(result.status).toBe(HeroStatus.PUBLISHED);
    });

    it('should throw BadRequestException when hero has no publisher', async () => {
      mockManager.findOne.mockResolvedValueOnce({
        ...mockHero,
        publisherId: null,
      });

      await expect(service.publish('hero-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when hero has fewer than 3 attributes', async () => {
      mockManager.findOne.mockResolvedValueOnce({
        ...mockHero,
        publisherId: 1,
        alignmentId: 1,
      });
      mockManager.count.mockResolvedValueOnce(2);
      mockManager.count.mockResolvedValueOnce(2);

      await expect(service.publish('hero-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when hero has fewer than 2 powers', async () => {
      mockManager.findOne.mockResolvedValueOnce({
        ...mockHero,
        publisherId: 1,
        alignmentId: 1,
      });
      mockManager.count.mockResolvedValueOnce(3);
      mockManager.count.mockResolvedValueOnce(1);

      await expect(service.publish('hero-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('archive', () => {
    it('should archive a hero', async () => {
      heroRepository.findOne.mockResolvedValueOnce(mockHero);
      heroRepository.save.mockResolvedValue({
        ...mockHero,
        status: HeroStatus.ARCHIVED,
      });

      const result = await service.archive('hero-1', 'user-1');

      expect(result.status).toBe(HeroStatus.ARCHIVED);
    });
  });

  describe('findOne', () => {
    it('should return a hero', async () => {
      heroRepository.findOne.mockResolvedValue(mockHero);

      const result = await service.findOne('hero-1', 'ADMIN');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when hero not found', async () => {
      heroRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('hero-1', 'ADMIN')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should hide non-PUBLISHED heroes from VIEWER', async () => {
      heroRepository.findOne.mockResolvedValueOnce({
        ...mockHero,
        status: HeroStatus.DRAFT,
      });

      await expect(service.findOne('hero-1', 'VIEWER')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
