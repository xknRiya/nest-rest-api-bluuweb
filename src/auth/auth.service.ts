import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
  async login(loginUserDto: LoginUserDto) {
    const user = await this.usersService.findOneByEmail(loginUserDto.email);

    if (!user) {
      throw new UnauthorizedException('email or password incorrect');
    }

    const isValidPassword = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('email or password incorrect');
    }

    const payload = { email: user.email, role: user.role };

    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }

  async register(user: RegisterUserDto) {
    if (await this.usersService.findOneByEmail(user.email)) {
      throw new BadRequestException('email already exists');
    }
    const registeredUser = await this.usersService.create({
      ...user,
      password: await bcrypt.hash(user.password, 10),
    });

    if (!registeredUser) {
      throw new BadRequestException('Something went wrong');
    }
    return { email: user.email, role: registeredUser.role };
  }

  async me({ email, role }: { email: string; role: string }) {
    return await Promise.resolve({ email, role });
  }
}
