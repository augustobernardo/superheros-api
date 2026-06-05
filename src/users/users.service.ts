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

    Object.assign(user, dto);
    const updated = await this.userRepository.save(user);

    await this.loggingService.info('User updated', { userId });

    return updated;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findDeleted(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.deleted_at IS NOT NULL')
      .getMany();
  }
}
