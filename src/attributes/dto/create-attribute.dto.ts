import { IsInt, IsNotEmpty, IsString, Length, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttributeDto {
  @ApiProperty({ description: 'Attribute name', example: 'Strength' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;

  @ApiProperty({ description: 'Attribute value (0-100)', example: 85 })
  @IsInt()
  @Min(0)
  @Max(100)
  value!: number;
}
