import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { LoggingService } from '../logging/logging.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Record<string, jest.Mock>;

  const mockUser = {
    id: 'user-1',
    cpf: '12345678901',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'VIEWER',
    isActive: true,
    deletedAt: null,
    bio: null,
    photoUrl: null,
    phone: null,
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        {
          provide: LoggingService,
          useValue: { info: jest.fn(), warning: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findMe', () => {
    it('should return a user by ID', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findMe('user-1');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findMe('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({ ...mockUser, name: 'Jane Doe' });

      const result = await service.update('user-1', { name: 'Jane Doe' });
      expect(result.name).toBe('Jane Doe');
    });

    it('should throw ConflictException when email is taken', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, id: 'other-user' });

      await expect(
        service.update('user-1', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      userRepository.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findDeleted', () => {
    it('should return deleted users', async () => {
      const mockQueryBuilder = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findDeleted();
      expect(result).toEqual([]);
    });
  });
});
