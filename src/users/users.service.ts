import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly loggingService: LoggingService,
  ) {}

  async findMe(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
        bio: true,
        photoUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findMe(userId);

    if (dto.email && dto.email !== user.email) {
      const emailInUse = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (emailInUse) {
        throw new ConflictException('Email already in use');
      }
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.photoUrl !== undefined) user.photoUrl = dto.photoUrl;
    if (dto.phone !== undefined) user.phone = dto.phone;

    const updated = await this.userRepository.save(user);

    await this.loggingService.info('User updated', { userId });

    return updated;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
        bio: true,
        photoUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findDeleted(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.deleted_at IS NOT NULL')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.cpf',
        'user.role',
        'user.bio',
        'user.photoUrl',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
        'user.deletedAt',
      ])
      .getMany();
  }
}
