// import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  name: string;

  email: string;

  password: string;
}
