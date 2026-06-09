import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Power } from './entities/power.entity';
import { CreatePowerDto } from './dto/create-power.dto';
import { UpdatePowerDto } from './dto/update-power.dto';
import { HeroesService } from '../heroes/heroes.service';
import { HeroStatus } from '../heroes/enums/hero-status.enum';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class PowersService {
  constructor(
    @InjectRepository(Power)
    private readonly powerRepository: Repository<Power>,
    private readonly heroesService: HeroesService,
    private readonly loggingService: LoggingService,
  ) {}

  async create(
    heroId: string,
    dto: CreatePowerDto,
    userId: string,
  ): Promise<Power> {
    const hero = await this.heroesService.assertHeroExists(heroId);

    if (hero.status === HeroStatus.ARCHIVED) {
      throw new BadRequestException('Cannot add powers to an archived hero');
    }

    const existing = await this.powerRepository.findOne({
      where: { heroId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Power "${dto.name}" already exists for this hero`,
      );
    }

    const power = this.powerRepository.create({
      heroId,
      name: dto.name,
      value: dto.value,
    });

    const saved = await this.powerRepository.save(power);

    await this.loggingService.info('Power created', {
      userId,
      heroId,
      powerId: saved.id,
      name: dto.name,
    });

    return saved;
  }

  async findAll(heroId: string): Promise<Power[]> {
    await this.heroesService.assertHeroExists(heroId);

    return this.powerRepository.find({
      where: { heroId },
    });
  }

  async update(
    heroId: string,
    id: string,
    dto: UpdatePowerDto,
    userId: string,
  ): Promise<Power> {
    const hero = await this.heroesService.assertHeroExists(heroId);

    if (hero.status === HeroStatus.ARCHIVED) {
      throw new BadRequestException('Cannot update powers of an archived hero');
    }

    const power = await this.assertPowerExists(id, heroId);

    if (dto.name && dto.name !== power.name) {
      const duplicate = await this.powerRepository.findOne({
        where: { heroId, name: dto.name },
      });
      if (duplicate) {
        throw new ConflictException(
          `Power "${dto.name}" already exists for this hero`,
        );
      }
    }

    Object.assign(power, dto);
    const updated = await this.powerRepository.save(power);

    await this.loggingService.info('Power updated', {
      userId,
      heroId,
      powerId: id,
    });

    return updated;
  }

  async remove(
    heroId: string,
    id: string,
    userId: string,
  ): Promise<{ message: string }> {
    await this.heroesService.assertHeroExists(heroId);
    await this.assertPowerExists(id, heroId);

    await this.powerRepository.softDelete(id);

    await this.loggingService.warning('Power deleted', {
      userId,
      heroId,
      powerId: id,
    });

    return { message: 'Power deleted successfully' };
  }

  async countActive(heroId: string): Promise<number> {
    return this.powerRepository.count({
      where: { heroId },
    });
  }

  private async assertPowerExists(id: string, heroId: string): Promise<Power> {
    const power = await this.powerRepository.findOne({
      where: { id, heroId },
    });

    if (!power) {
      throw new NotFoundException('Power not found');
    }

    return power;
  }
}
