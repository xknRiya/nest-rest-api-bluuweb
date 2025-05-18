import { Transform } from 'class-transformer';
import { IsEmail, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  @Transform(({ value }: { value: string }) => value.trim())
  password: string;
}
