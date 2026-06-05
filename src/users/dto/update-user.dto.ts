import { IsOptional, IsString, IsUrl, Length, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @IsOptional()
  @IsUrl({}, { message: 'photo_url must be a valid URL' })
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s\-().]{7,20}$/, {
    message: 'Invalid phone format',
  })
  phone?: string;
}
