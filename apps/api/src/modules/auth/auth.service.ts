import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';

import { UserRole } from '../../entities/enums';
import { User } from '../../entities/user.entity';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  private signAccessToken(user: User) {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET missing');

    return this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, kind: 'access' },
      { secret, expiresIn: '15m' },
    );
  }

  private signRefreshToken(user: User) {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET missing');

    return this.jwtService.sign(
      { sub: user.id, role: user.role, kind: 'refresh', jti: randomUUID() },
      { secret: refreshSecret, expiresIn: '30d' },
    );
  }

  private async issueAuthTokens(user: User) {
    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);
    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.userRepo.update({ id: user.id }, { refreshTokenHash });
    user.refreshTokenHash = refreshTokenHash;
    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await hash(dto.password, 10);
    const user = this.userRepo.create({
      email,
      phone: dto.phone ?? null,
      passwordHash,
      fullName: dto.fullName,
      role: UserRole.customer,
      isVerified: false,
    });
    const savedUser = await this.userRepo.save(user);
    const tokens = await this.issueAuthTokens(savedUser);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: savedUser.id, email: savedUser.email, fullName: savedUser.fullName, role: savedUser.role },
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueAuthTokens(user);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    };
  }

  async refresh(dto: RefreshDto) {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET missing');

    let payload: { sub?: string; kind?: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, { secret: refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (!payload?.sub || payload.kind !== 'refresh') throw new UnauthorizedException('Invalid refresh token');

    const user = await this.userRepo.findOne({ where: { id: payload.sub as string } });
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    if (!user.refreshTokenHash) throw new UnauthorizedException('Invalid refresh token');
    const currentDigest = createHash('sha256').update(dto.refreshToken).digest('hex');
    const refreshOk =
      user.refreshTokenHash === currentDigest ||
      // Backward compatibility for old bcrypt-based records.
      (user.refreshTokenHash.length !== 64 && (await compare(dto.refreshToken, user.refreshTokenHash)));
    if (!refreshOk) throw new UnauthorizedException('Invalid refresh token');

    const tokens = await this.issueAuthTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    };
  }

  async logout(dto?: RefreshDto) {
    if (!dto?.refreshToken) return { success: true };
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET missing');

    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: string; kind?: string }>(dto.refreshToken, {
        secret: refreshSecret,
      });
      if (payload?.sub && payload.kind === 'refresh') {
        const user = await this.userRepo.findOne({ where: { id: payload.sub } });
        if (user) {
          user.refreshTokenHash = null;
          await this.userRepo.save(user);
        }
      }
    } catch {
      return { success: true };
    }

    return { success: true };
  }

  async notImplemented() {
    throw new BadRequestException('Not implemented yet');
  }
}

