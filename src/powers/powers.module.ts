import { HeroesModule } from '../heroes/heroes.module';
import { Module } from '@nestjs/common';
import { Power } from './entities/power.entity';
import { PowersController } from './powers.controller';
import { PowersService } from './powers.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Power]), HeroesModule],
  controllers: [PowersController],
  providers: [PowersService],
  exports: [PowersService],
})
export class PowersModule {}
