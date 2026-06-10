import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BattleQueryDto {
  @ApiProperty({ description: 'First publisher ID', example: 1 })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  publisherAId!: number;

  @ApiProperty({ description: 'Second publisher ID', example: 2 })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  publisherBId!: number;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
