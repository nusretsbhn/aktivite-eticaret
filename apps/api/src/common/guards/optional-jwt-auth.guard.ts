import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

type AccessTokenPayload = {
  sub?: string;
  email?: string;
  role?: string;
  kind?: string;
};

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ headers?: Record<string, string>; user?: AccessTokenPayload }>();
    const auth = req.headers?.authorization ?? req.headers?.Authorization;
    if (!auth) return true;
    if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid bearer token');
    }

    const token = auth.slice('Bearer '.length).trim();
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET missing');

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, { secret });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    if (!payload?.sub || payload.kind !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    req.user = payload;
    return true;
  }
}

