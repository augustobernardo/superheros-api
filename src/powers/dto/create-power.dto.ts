import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePowerDto {
  @ApiProperty({ description: 'Power name', example: 'Flight' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;

  @ApiPropertyOptional({ description: 'Power value (0-100)', example: 90 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  value?: number;
}
