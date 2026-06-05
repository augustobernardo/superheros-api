import { IsInt, IsOptional, IsString, Length } from 'class-validator';

export class UpdateHeroDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsInt()
  publisherId?: number;

  @IsOptional()
  @IsInt()
  alignmentId?: number;
}
