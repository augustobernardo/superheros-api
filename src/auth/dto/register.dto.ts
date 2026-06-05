import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Length(11, 11, { message: 'CPF must have exactly 11 digits' })
  @Matches(/^\d{11}$/, { message: 'CPF must contain only digits' })
  cpf!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  name!: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 255, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message:
      'Password must contain at least one uppercase letter, one number and one special character',
  })
  password!: string;
}
