import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateHeroDto {
  @ApiPropertyOptional({ description: 'Hero name', example: 'Iron Man' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({ description: 'Publisher ID', example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  publisherId?: number;

  @ApiPropertyOptional({ description: 'Alignment ID', example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  alignmentId?: number;

  @ApiPropertyOptional({ description: 'Full name', example: 'Tony Stark' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  fullName?: string;

  @ApiPropertyOptional({ description: 'Height in cm', example: 185 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  heightCm?: number;

  @ApiPropertyOptional({ description: 'Weight in kg', example: 85 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(500)
  weightKg?: number;
}
