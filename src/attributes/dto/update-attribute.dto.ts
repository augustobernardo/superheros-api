import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAttributeDto {
  @ApiPropertyOptional({ description: 'Attribute name', example: 'Strength' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({ description: 'Attribute value (0-100)', example: 90 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  value?: number;
}
