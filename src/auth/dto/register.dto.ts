import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsCpf } from '../../common/validators/is-cpf.validator';

export class RegisterDto {
  @ApiProperty({ description: 'CPF (11 digits only)', example: '12345678909' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11, { message: 'CPF must have exactly 11 digits' })
  @Matches(/^\d{11}$/, { message: 'CPF must contain only digits' })
  @IsCpf()
  cpf!: string;

  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  name!: string;

  @ApiProperty({ description: 'Email address', example: 'john@example.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Password (min 8 chars, 1 uppercase, 1 number, 1 special)',
    example: 'Str0ng!Pass',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 255, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\]{};':"\\|,.<>/?])/, {
    message:
      'Password must contain at least one uppercase letter, one number and one special character',
  })
  password!: string;
}
