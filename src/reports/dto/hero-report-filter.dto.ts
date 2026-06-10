import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OrderBy {
  ATTRIBUTES = 'attributes',
  POWERS = 'powers',
}

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class HeroReportFilterDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort by',
    enum: OrderBy,
    default: OrderBy.ATTRIBUTES,
  })
  @IsOptional()
  @IsEnum(OrderBy)
  orderBy?: OrderBy = OrderBy.ATTRIBUTES;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: Order,
    default: Order.ASC,
  })
  @IsOptional()
  @IsEnum(Order)
  orderDirection?: Order = Order.ASC;

  @ApiPropertyOptional({
    description: 'Filter by attribute name',
    example: 'Strength',
  })
  @IsOptional()
  @IsString()
  attribute?: string;

  @ApiPropertyOptional({
    description: 'Filter by power name',
    example: 'Flight',
  })
  @IsOptional()
  @IsString()
  power?: string;

  @ApiPropertyOptional({
    description: 'Filter by alignment name',
    example: 'Good',
  })
  @IsOptional()
  @IsString()
  alignment?: string;

  @ApiPropertyOptional({
    description: 'Filter by publisher name',
    example: 'Marvel',
  })
  @IsOptional()
  @IsString()
  publisher?: string;
}
