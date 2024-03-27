import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { Request } from 'express';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token =  this.extractTokenFromHeader(request) || this.extractJWTFromCookie(request) ;
    
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
    
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
      request['user'].id = payload.sub
    } catch {
      request['user'] = null;
      return true;
    }
    return true;
  }
  private  extractJWTFromCookie(req: Request): string | null {
    if (req.cookies && req.cookies.upspot_access_token) {
      return req.cookies.upspot_access_token;
    }
    return null;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
