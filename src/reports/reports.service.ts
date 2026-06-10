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
    const order = filters.orderDirection || ('ASC' as const);

    // Build a dedicated count query (lightweight — no leftJoinAndSelect, no subquery joins)
    const countQuery = this.heroRepository
      .createQueryBuilder('hero')
      .leftJoin('hero.alignment', 'alignment')
      .leftJoin('hero.publisher', 'publisher')
      .where('hero.status = :status', { status: HeroStatus.PUBLISHED })
      .andWhere('hero.deleted_at IS NULL');

    this.applyFilterConditions(countQuery, filters);

    const totalCount = await countQuery.getCount();

    // Build data query with all relations, subqueries, sorting, and pagination
    const dataQuery = this.heroRepository
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
            .select('attribute.hero_id', 'hid')
            .addSelect('SUM(attribute.value)', 'total_val')
            .from(Attribute, 'attribute')
            .where('attribute.deleted_at IS NULL')
            .groupBy('attribute.hero_id'),
        'attr_sum',
        'attr_sum.hid = hero.id',
      )
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('power.hero_id', 'hid')
            .addSelect('SUM(COALESCE(power.value, 0))', 'total_pow_val')
            .from(Power, 'power')
            .where('power.deleted_at IS NULL')
            .groupBy('power.hero_id'),
        'pow_sum',
        'pow_sum.hid = hero.id',
      )
      .where('hero.status = :status', { status: HeroStatus.PUBLISHED })
      .andWhere('hero.deleted_at IS NULL');

    this.applyFilterConditions(dataQuery, filters);

    // Sorting — use lowercase aliases to match Postgres unquoted identifier folding
    if (orderBy === OrderBy.POWERS) {
      dataQuery
        .addSelect('COALESCE(pow_sum.total_pow_val, 0)', 'sort_val')
        .orderBy('sort_val', order);
    } else {
      dataQuery
        .addSelect('COALESCE(attr_sum.total_val, 0)', 'sort_val')
        .orderBy('sort_val', order);
    }

    dataQuery
      .addOrderBy('hero.name', 'ASC')
      .distinct(true)
      .skip(skip)
      .take(limit);

    const heroes = await dataQuery.getMany();

    return {
      data: heroes,
      total: totalCount,
      page,
      limit,
    };
  }

  private applyFilterConditions(
    query: import('typeorm').SelectQueryBuilder<Hero>,
    filters: HeroReportFilterDto,
  ): void {
    if (filters.attribute) {
      query
        .leftJoin(
          Attribute,
          'attr_filter',
          'attr_filter.hero_id = hero.id AND LOWER(attr_filter.name) ILIKE LOWER(:attrName) AND attr_filter.deleted_at IS NULL',
          { attrName: `%${filters.attribute}%` },
        )
        .andWhere('attr_filter.id IS NOT NULL');
    }

    if (filters.power) {
      query
        .leftJoin(
          Power,
          'pow_filter',
          'pow_filter.hero_id = hero.id AND LOWER(pow_filter.name) ILIKE LOWER(:powName) AND pow_filter.deleted_at IS NULL',
          { powName: `%${filters.power}%` },
        )
        .andWhere('pow_filter.id IS NOT NULL');
    }

    if (filters.alignment) {
      query.andWhere('LOWER(alignment.name) ILIKE LOWER(:alignmentName)', {
        alignmentName: `%${filters.alignment}%`,
      });
    }

    if (filters.publisher) {
      query.andWhere('LOWER(publisher.name) ILIKE LOWER(:publisherName)', {
        publisherName: `%${filters.publisher}%`,
      });
    }
  }
}
