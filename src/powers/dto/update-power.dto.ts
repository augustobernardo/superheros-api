import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePowerDto {
  @ApiPropertyOptional({ description: 'Power name', example: 'Flight' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({ description: 'Power value (0-100)', example: 95 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  value?: number;
}
