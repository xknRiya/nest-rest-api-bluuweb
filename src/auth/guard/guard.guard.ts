import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../constants/jwt.constants';
import { Request } from 'express';

interface Jwt {
  email: string;
  role: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request) {
      return false;
    }
    const token = this.extractTokenFromHeader(request);
    try {
      const { email, role } = await this.verifyToken(token);
      request['user'] = { email, role };
    } catch {
      throw new UnauthorizedException();
    }
    return Promise.resolve(true);
  }

  private extractTokenFromHeader(request: Request): string {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer') {
      throw new UnauthorizedException('Unknown token type');
    }

    return token;
  }

  private async verifyToken(token: string): Promise<Jwt> {
    const payload = await this.jwtService.verifyAsync<Jwt>(token, {
      secret: jwtConstants.secret,
    });

    return payload;
  }
}
