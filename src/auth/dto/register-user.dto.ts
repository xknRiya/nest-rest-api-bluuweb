import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @MinLength(5)
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  @Transform(({ value }: { value: string }) => value.trim())
  password: string;
}
