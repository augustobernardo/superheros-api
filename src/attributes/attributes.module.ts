import { Attribute } from './entities/attribute.entity';
import { AttributesController } from './attributes.controller';
import { AttributesService } from './attributes.service';
import { HeroesModule } from '../heroes/heroes.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Attribute]), HeroesModule],
  controllers: [AttributesController],
  providers: [AttributesService],
  exports: [AttributesService],
})
export class AttributesModule {}
