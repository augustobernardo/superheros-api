import { Alignment } from './entities/alignment.entity';
import { Attribute } from '../attributes/entities/attribute.entity';
import { Hero } from './entities/hero.entity';
import { HeroesController } from './heroes.controller';
import { HeroesService } from './heroes.service';
import { Module } from '@nestjs/common';
import { Power } from '../powers/entities/power.entity';
import { Publisher } from './entities/publisher.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hero, Publisher, Alignment, Attribute, Power]),
  ],
  controllers: [HeroesController],
  providers: [HeroesService],
  exports: [HeroesService],
})
export class HeroesModule {}
