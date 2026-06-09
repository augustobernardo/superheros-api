import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
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
  publisherId?: number;

  @ApiPropertyOptional({ description: 'Alignment ID', example: 1 })
  @IsOptional()
  @IsInt()
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
  heightCm?: number;

  @ApiPropertyOptional({ description: 'Weight in kg', example: 85 })
  @IsOptional()
  @IsInt()
  @Min(0)
  weightKg?: number;
}
