import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hero } from './entities/hero.entity';
import { Publisher } from './entities/publisher.entity';
import { Alignment } from './entities/alignment.entity';
import { CreateHeroDto } from './dto/create-hero.dto';
import { UpdateHeroDto } from './dto/update-hero.dto';
import { HeroStatus } from './enums/hero-status.enum';
import { LoggingService } from '../logging/logging.service';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class HeroesService {
  constructor(
    @InjectRepository(Hero)
    private readonly heroRepository: Repository<Hero>,
    @InjectRepository(Publisher)
    private readonly publisherRepository: Repository<Publisher>,
    @InjectRepository(Alignment)
    private readonly alignmentRepository: Repository<Alignment>,
    private readonly loggingService: LoggingService,
  ) {}

  async create(dto: CreateHeroDto, userId: string): Promise<Hero> {
    const existing = await this.heroRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Hero with this name already exists');
    }

    if (dto.publisherId) {
      await this.assertPublisherExists(dto.publisherId);
    }

    if (dto.alignmentId) {
      await this.assertAlignmentExists(dto.alignmentId);
    }

    const hero = this.heroRepository.create({
      name: dto.name,
      publisherId: dto.publisherId ?? null,
      alignmentId: dto.alignmentId ?? null,
      status: HeroStatus.DRAFT,
    });

    const saved = await this.heroRepository.save(hero);

    await this.loggingService.info('Hero created', {
      userId,
      heroId: saved.id,
      heroName: saved.name,
    });

    return this.heroRepository.findOne({
      where: { id: saved.id },
      relations: {
        publisher: true,
        alignment: true,
      },
    }) as Promise<Hero>;
  }

  async findAll(userRole: string): Promise<Hero[]> {
    const query = this.heroRepository
      .createQueryBuilder('hero')
      .leftJoinAndSelect('hero.publisher', 'publisher')
      .leftJoinAndSelect('hero.alignment', 'alignment');

    if ((userRole as UserRole) === UserRole.VIEWER) {
      query.where('hero.status = :status', { status: HeroStatus.PUBLISHED });
    }

    return query.getMany();
  }

  async findOne(id: string, userRole: string): Promise<Hero> {
    const hero = await this.heroRepository.findOne({ where: { id } });

    if (!hero) {
      throw new NotFoundException('Hero not found');
    }

    const userRoleEnum = userRole as UserRole;
    const heroStatusEnum = hero.status;

    if (
      userRoleEnum === UserRole.VIEWER &&
      heroStatusEnum !== HeroStatus.PUBLISHED
    ) {
      throw new NotFoundException('Hero not found');
    }

    return hero;
  }

  async update(id: string, dto: UpdateHeroDto, userId: string): Promise<Hero> {
    const hero = await this.assertHeroExists(id);
    this.assertNotArchived(hero);

    if (dto.publisherId) {
      await this.assertPublisherExists(dto.publisherId);
    }

    if (dto.alignmentId) {
      await this.assertAlignmentExists(dto.alignmentId);
    }

    Object.assign(hero, dto);
    const updated = await this.heroRepository.save(hero);

    await this.loggingService.info('Hero updated', { userId, heroId: id });

    return updated;
  }

  async publish(id: string, userId: string): Promise<Hero> {
    const hero = await this.assertHeroExists(id);
    this.assertNotArchived(hero);

    if (!hero.publisherId) {
      throw new BadRequestException(
        'Hero must have a publisher to be published',
      );
    }

    if (!hero.alignmentId) {
      throw new BadRequestException(
        'Hero must have an alignment to be published',
      );
    }

    // Get active attributes and powers - to be implemented when AttributesModule and PowersModule exist exist
    // For now -> validate publisher and alignment
    hero.status = HeroStatus.PUBLISHED;
    const updated = await this.heroRepository.save(hero);

    await this.loggingService.info('Hero published', { userId, heroId: id });

    return updated;
  }

  async archive(id: string, userId: string): Promise<Hero> {
    const hero = await this.assertHeroExists(id);

    hero.status = HeroStatus.ARCHIVED;
    const updated = await this.heroRepository.save(hero);

    await this.loggingService.warning('Hero archived', { userId, heroId: id });

    return updated;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    await this.assertHeroExists(id);
    await this.heroRepository.softDelete(id);

    await this.loggingService.warning('Hero deleted', { userId, heroId: id });

    return { message: 'Hero deleted successfully' };
  }

  async findDeleted(): Promise<Hero[]> {
    return this.heroRepository
      .createQueryBuilder('hero')
      .withDeleted()
      .where('hero.deleted_at IS NOT NULL')
      .leftJoinAndSelect('hero.publisher', 'publisher')
      .leftJoinAndSelect('hero.alignment', 'alignment')
      .getMany();
  }

  async assertHeroExists(id: string): Promise<Hero> {
    const hero = await this.heroRepository.findOne({ where: { id } });
    if (!hero) {
      throw new NotFoundException('Hero not found');
    }
    return hero;
  }

  private assertNotArchived(hero: Hero): void {
    if (hero.status === HeroStatus.ARCHIVED) {
      throw new BadRequestException('Archived heroes cannot be modified');
    }
  }

  private async assertPublisherExists(id: number): Promise<void> {
    const publisher = await this.publisherRepository.findOne({ where: { id } });
    if (!publisher) {
      throw new NotFoundException(`Publisher with id ${id} not found`);
    }
  }

  private async assertAlignmentExists(id: number): Promise<void> {
    const alignment = await this.alignmentRepository.findOne({ where: { id } });
    if (!alignment) {
      throw new NotFoundException(`Alignment with id ${id} not found`);
    }
  }
}
