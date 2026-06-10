import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Hero } from '../heroes/entities/hero.entity';
import { Attribute } from '../attributes/entities/attribute.entity';
import { Power } from '../powers/entities/power.entity';
import { HeroStatus } from '../heroes/enums/hero-status.enum';

interface BattleResult {
  heroA: { id: string; name: string };
  heroB: { id: string; name: string };
  rounds: BattleRound[];
  heroAWins: number;
  heroBWins: number;
  draws: number;
  winner: string | null;
}

interface BattleRound {
  category: string;
  itemName: string;
  valueA: number | null;
  valueB: number | null;
  winner: 'A' | 'B' | 'draw';
}

export interface PublisherBattleResult {
  publisherA: string;
  publisherB: string;
  matchResults: BattleResult[];
  publisherAWins: number;
  publisherBWins: number;
  overallWinner: string;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class BattlesService {
  constructor(
    @InjectRepository(Hero)
    private readonly heroRepository: Repository<Hero>,
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
    @InjectRepository(Power)
    private readonly powerRepository: Repository<Power>,
  ) {}

  async battle(
    publisherAId: number,
    publisherBId: number,
    page = 1,
    limit = 20,
  ): Promise<PublisherBattleResult> {
    if (publisherAId === publisherBId) {
      throw new BadRequestException('Publishers must be different');
    }

    const MAX_HEROES = 20;

    const heroesA = await this.heroRepository.find({
      where: {
        publisherId: publisherAId,
        status: HeroStatus.PUBLISHED,
      },
      relations: { publisher: true },
      take: MAX_HEROES,
    });

    const heroesB = await this.heroRepository.find({
      where: {
        publisherId: publisherBId,
        status: HeroStatus.PUBLISHED,
      },
      relations: { publisher: true },
      take: MAX_HEROES,
    });

    if (heroesA.length === 0 || heroesB.length === 0) {
      const publisherA =
        heroesA.length > 0
          ? heroesA[0].publisher?.name || `Publisher ${publisherAId}`
          : `Publisher ${publisherAId}`;
      const publisherB =
        heroesB.length > 0
          ? heroesB[0].publisher?.name || `Publisher ${publisherBId}`
          : `Publisher ${publisherBId}`;

      return {
        publisherA,
        publisherB,
        matchResults: [],
        publisherAWins: 0,
        publisherBWins: 0,
        overallWinner: 'Draw',
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    const heroIdsA = heroesA.map((h) => h.id);
    const heroIdsB = heroesB.map((h) => h.id);

    const [attributesA, powersA] = await Promise.all([
      this.attributeRepository.find({
        where: { heroId: In(heroIdsA) },
      }),
      this.powerRepository.find({
        where: { heroId: In(heroIdsA) },
      }),
    ]);

    const [attributesB, powersB] = await Promise.all([
      this.attributeRepository.find({
        where: { heroId: In(heroIdsB) },
      }),
      this.powerRepository.find({
        where: { heroId: In(heroIdsB) },
      }),
    ]);

    const attrMapA = this.groupByHeroId(attributesA);
    const attrMapB = this.groupByHeroId(attributesB);
    const powerMapA = this.groupByHeroId(powersA);
    const powerMapB = this.groupByHeroId(powersB);

    const allMatches: BattleResult[] = [];
    let publisherAWins = 0;
    let publisherBWins = 0;

    for (const heroA of heroesA) {
      for (const heroB of heroesB) {
        const match = this.resolveMatch(
          heroA,
          heroB,
          attrMapA.get(heroA.id) || [],
          attrMapB.get(heroB.id) || [],
          powerMapA.get(heroA.id) || [],
          powerMapB.get(heroB.id) || [],
        );

        if (match.winner === 'A') publisherAWins++;
        else if (match.winner === 'B') publisherBWins++;

        allMatches.push(match);
      }
    }

    const total = allMatches.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedMatches = allMatches.slice(skip, skip + limit);

    const publisherA =
      heroesA[0].publisher?.name || `Publisher ${publisherAId}`;
    const publisherB =
      heroesB[0].publisher?.name || `Publisher ${publisherBId}`;

    return {
      publisherA,
      publisherB,
      matchResults: paginatedMatches,
      publisherAWins,
      publisherBWins,
      overallWinner:
        publisherAWins > publisherBWins
          ? publisherA
          : publisherBWins > publisherAWins
            ? publisherB
            : 'Draw',
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  private resolveMatch(
    heroA: Hero,
    heroB: Hero,
    attrsA: Attribute[],
    attrsB: Attribute[],
    powersA: Power[],
    powersB: Power[],
  ): BattleResult {
    const rounds: BattleRound[] = [];

    const commonAttrs = this.findCommon(attrsA, attrsB);
    for (const { itemA, itemB } of commonAttrs) {
      rounds.push(
        this.resolveRound('attribute', itemA.name, itemA.value, itemB.value),
      );
    }

    const commonPowers = this.findCommon(powersA, powersB);
    for (const { itemA, itemB } of commonPowers) {
      rounds.push(
        this.resolveRound('power', itemA.name, itemA.value, itemB.value),
      );
    }

    const heroAWins = rounds.filter((r) => r.winner === 'A').length;
    const heroBWins = rounds.filter((r) => r.winner === 'B').length;
    const draws = rounds.filter((r) => r.winner === 'draw').length;

    let winner: string | null;
    if (heroAWins > heroBWins) winner = heroA.name;
    else if (heroBWins > heroAWins) winner = heroB.name;
    else winner = null;

    return {
      heroA: { id: heroA.id, name: heroA.name },
      heroB: { id: heroB.id, name: heroB.name },
      rounds,
      heroAWins,
      heroBWins,
      draws,
      winner,
    };
  }

  private resolveRound(
    category: string,
    itemName: string,
    valueA: number | null,
    valueB: number | null,
  ): BattleRound {
    if (valueA === null || valueB === null) {
      return {
        category,
        itemName,
        valueA,
        valueB,
        winner: 'draw',
      };
    }
    return {
      category,
      itemName,
      valueA,
      valueB,
      winner: valueA > valueB ? 'A' : valueB > valueA ? 'B' : 'draw',
    };
  }

  private findCommon<T extends { name: string; value: number | null }>(
    itemsA: T[],
    itemsB: T[],
  ): Array<{ itemA: T; itemB: T }> {
    const mapB = new Map(itemsB.map((i) => [i.name.toLowerCase(), i]));
    const result: Array<{ itemA: T; itemB: T }> = [];

    for (const itemA of itemsA) {
      const itemB = mapB.get(itemA.name.toLowerCase());
      if (itemB) {
        result.push({ itemA, itemB });
      }
    }

    return result;
  }

  private groupByHeroId<T extends { heroId: string }>(
    items: T[],
  ): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const item of items) {
      const existing = map.get(item.heroId);
      if (existing) {
        existing.push(item);
      } else {
        map.set(item.heroId, [item]);
      }
    }
    return map;
  }
}
