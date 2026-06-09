import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Attribute } from './entities/attribute.entity';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { HeroesService } from '../heroes/heroes.service';
import { HeroStatus } from '../heroes/enums/hero-status.enum';
import { UserRole } from '../users/enums/user-role.enum';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
    private readonly heroesService: HeroesService,
    private readonly loggingService: LoggingService,
  ) {}

  async create(
    heroId: string,
    dto: CreateAttributeDto,
    userId: string,
  ): Promise<Attribute> {
    const hero = await this.heroesService.assertHeroExists(heroId);

    if (hero.status === HeroStatus.ARCHIVED) {
      throw new BadRequestException(
        'Cannot add attributes to an archived hero',
      );
    }

    const existing = await this.attributeRepository.findOne({
      where: { heroId, name: dto.name },
      withDeleted: true,
    });
    if (existing && !existing.deletedAt) {
      throw new ConflictException(
        `Attribute "${dto.name}" already exists for this hero`,
      );
    }

    if (existing?.deletedAt) {
      const refreshedHero = await this.heroesService.assertHeroExists(heroId);
      if (refreshedHero.status === HeroStatus.ARCHIVED) {
        throw new BadRequestException(
          'Cannot add attributes to an archived hero',
        );
      }

      await this.attributeRepository.restore(existing.id);
      Object.assign(existing, dto);
      const restored = await this.attributeRepository.save(existing);
      await this.loggingService.info('Attribute restored', {
        userId,
        heroId,
        attributeId: restored.id,
        name: dto.name,
      });
      return restored;
    }

    const attribute = this.attributeRepository.create({
      heroId,
      name: dto.name,
      value: dto.value,
    });

    const saved = await this.attributeRepository.save(attribute);

    await this.loggingService.info('Attribute created', {
      userId,
      heroId,
      attributeId: saved.id,
      name: dto.name,
    });

    return saved;
  }

  async findAll(heroId: string, userRole?: string): Promise<Attribute[]> {
    const hero = await this.heroesService.assertHeroExists(heroId);

    if (userRole === UserRole.VIEWER && hero.status !== HeroStatus.PUBLISHED) {
      throw new NotFoundException('Hero not found');
    }

    return this.attributeRepository.find({
      where: { heroId },
    });
  }

  async update(
    heroId: string,
    id: string,
    dto: UpdateAttributeDto,
    userId: string,
  ): Promise<Attribute> {
    const hero = await this.heroesService.assertHeroExists(heroId);

    if (hero.status === HeroStatus.ARCHIVED) {
      throw new BadRequestException(
        'Cannot update attributes of an archived hero',
      );
    }

    const attribute = await this.assertAttributeExists(id, heroId);

    if (dto.name && dto.name !== attribute.name) {
      const duplicate = await this.attributeRepository.findOne({
        where: { heroId, name: dto.name },
      });
      if (duplicate) {
        throw new ConflictException(
          `Attribute "${dto.name}" already exists for this hero`,
        );
      }
    }

    Object.assign(attribute, dto);
    const updated = await this.attributeRepository.save(attribute);

    await this.loggingService.info('Attribute updated', {
      userId,
      heroId,
      attributeId: id,
    });

    return updated;
  }

  async remove(
    heroId: string,
    id: string,
    userId: string,
  ): Promise<{ message: string }> {
    const hero = await this.heroesService.assertHeroExists(heroId);
    if (hero.status === HeroStatus.ARCHIVED) {
      throw new BadRequestException(
        'Cannot remove attributes from an archived hero',
      );
    }
    await this.assertAttributeExists(id, heroId);

    await this.attributeRepository.softDelete(id);

    await this.loggingService.warning('Attribute deleted', {
      userId,
      heroId,
      attributeId: id,
    });

    return { message: 'Attribute deleted successfully' };
  }

  async countActive(heroId: string): Promise<number> {
    return this.attributeRepository.count({
      where: { heroId, deletedAt: IsNull() },
    });
  }

  private async assertAttributeExists(
    id: string,
    heroId: string,
  ): Promise<Attribute> {
    const attribute = await this.attributeRepository.findOne({
      where: { id, heroId },
      withDeleted: true,
    });

    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }

    return attribute;
  }
}
