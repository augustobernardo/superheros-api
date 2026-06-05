import { Alignment } from './entities/alignment.entity';
import { Hero } from './entities/hero.entity';
import { HeroesController } from './heroes.controller';
import { HeroesService } from './heroes.service';
import { Module } from '@nestjs/common';
import { Publisher } from './entities/publisher.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Hero, Publisher, Alignment])],
  controllers: [HeroesController],
  providers: [HeroesService],
  exports: [HeroesService],
})
export class HeroesModule {}
