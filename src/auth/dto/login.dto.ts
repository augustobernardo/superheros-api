import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'CPF or email', example: 'john@example.com' })
  @IsString()
  @IsNotEmpty()
  cpfOrEmail!: string;

  @ApiProperty({ description: 'Password', example: 'Str0ng!Pass' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
