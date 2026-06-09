import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateHeroDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;

  @IsOptional()
  @IsInt()
  publisherId?: number;

  @IsOptional()
  @IsInt()
  alignmentId?: number;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  fullName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  heightCm?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  weightKg?: number;
}
