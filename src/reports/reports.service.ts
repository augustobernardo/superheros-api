import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hero } from '../heroes/entities/hero.entity';
import { Attribute } from '../attributes/entities/attribute.entity';
import { Power } from '../powers/entities/power.entity';
import { HeroReportFilterDto, OrderBy } from './dto/hero-report-filter.dto';
import { HeroStatus } from '../heroes/enums/hero-status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Hero)
    private readonly heroRepository: Repository<Hero>,
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
    @InjectRepository(Power)
    private readonly powerRepository: Repository<Power>,
  ) {}

  async getHeroesReport(filters: HeroReportFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    const orderBy = filters.orderBy || OrderBy.ATTRIBUTES;
    const order = filters.order || 'ASC' as const;

    // Start with base query
    let query = this.heroRepository
      .createQueryBuilder('hero')
      .leftJoinAndSelect('hero.publisher', 'publisher')
      .leftJoinAndSelect('hero.alignment', 'alignment')
      .leftJoinAndSelect(
        'hero.attributes',
        'attributes',
        'attributes.deleted_at IS NULL',
      )
      .leftJoinAndSelect('hero.powers', 'powers', 'powers.deleted_at IS NULL')
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('attribute.hero_id', 'heroId')
            .addSelect('SUM(attribute.value)', 'totalAttributeValue')
            .from(Attribute, 'attribute')
            .where('attribute.deleted_at IS NULL')
            .groupBy('attribute.hero_id'),
        'attributeSum',
        'attributeSum.heroId = hero.id',
      )
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('power.hero_id', 'heroId')
            .addSelect('SUM(COALESCE(power.value, 0))', 'totalPowerValue')
            .from(Power, 'power')
            .where('power.deleted_at IS NULL')
            .groupBy('power.hero_id'),
        'powerSum',
        'powerSum.heroId = hero.id',
      );

    // Filter: Only PUBLISHED heroes and not deleted
    query = query
      .where('hero.status = :status', { status: HeroStatus.PUBLISHED })
      .andWhere('hero.deleted_at IS NULL');

    // Filter by attribute name if provided
    if (filters.attribute) {
      query = query.leftJoin(
        Attribute,
        'attrFilter',
        'attrFilter.hero_id = hero.id AND LOWER(attrFilter.name) ILIKE LOWER(:attrName) AND attrFilter.deleted_at IS NULL',
        { attrName: `%${filters.attribute}%` },
      );
      query = query.andWhere('attrFilter.id IS NOT NULL');
    }

    // Filter by power name if provided
    if (filters.power) {
      query = query.leftJoin(
        Power,
        'powerFilter',
        'powerFilter.hero_id = hero.id AND LOWER(powerFilter.name) ILIKE LOWER(:powerName) AND powerFilter.deleted_at IS NULL',
        { powerName: `%${filters.power}%` },
      );
      query = query.andWhere('powerFilter.id IS NOT NULL');
    }

    // Filter by alignment if provided
    if (filters.alignment) {
      query = query.andWhere(
        'LOWER(alignment.name) ILIKE LOWER(:alignmentName)',
        { alignmentName: `%${filters.alignment}%` },
      );
    }

    // Filter by publisher if provided
    if (filters.publisher) {
      query = query.andWhere(
        'LOWER(publisher.name) ILIKE LOWER(:publisherName)',
        { publisherName: `%${filters.publisher}%` },
      );
    }

    // Sorting
    if (orderBy === OrderBy.POWERS) {
      query = query.addSelect(
        'COALESCE(powerSum.totalPowerValue, 0)',
        'totalPowerValue',
      );
      query = query.orderBy('totalPowerValue', order);
    } else {
      query = query.addSelect(
        'COALESCE(attributeSum.totalAttributeValue, 0)',
        'totalAttributeValue',
      );
      query = query.orderBy('totalAttributeValue', order);
    }

    // Remove duplicate results from joins
    query = query.distinct(true);

    // Secondary sort by name for consistency
    query = query.addOrderBy('hero.name', 'ASC');

    // Get total count using a simpler distinct query to avoid DISTINCT + JOIN inaccuracies
    const totalCount = await query.clone().getCount();

    // Apply pagination
    query = query.skip(skip).take(limit);

    // Get results
    const heroes = await query.getMany();

    return {
      data: heroes,
      total: totalCount,
      page,
      limit,
    };
  }
}
