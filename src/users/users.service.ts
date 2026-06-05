import { Injectable, NotFoundException } from '@nestjs/common';
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

    Object.assign(user, dto);

    const updated = await this.userRepository.save(user);

    await this.loggingService.info('User updated', { userId });

    return updated;
  }

  // Only ADMIN users can access these endpoints to list all users
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  // Only ADMIN users can access this endpoint to list all deleted users
  async findDeleted(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.deleted_at IS NOT NULL')
      .getMany();
  }
}
