import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreatePowerDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  value?: number;
}
