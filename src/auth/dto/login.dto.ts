import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  cpfOrEmail!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
