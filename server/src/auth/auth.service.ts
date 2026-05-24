import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { PublicUser, toPublicUser } from '../common/utils/entity-response';
import { UserRole } from '../database/enums';
import { User } from '../database/user.entity';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload, RefreshJwtPayload } from './jwt-payload.interface';

export interface AuthTokenResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokenResponse> {
    const user = await this.usersService.create({
      ...dto,
      role: UserRole.PATIENT,
      isActive: true,
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const user = await this.usersService.findByEmail(dto.email, true);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await this.usersService.verifySecret(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokenResponse> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const blacklisted = await this.redis.get(this.blacklistKey(payload.jti));

    if (blacklisted) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const user = await this.usersService.findByIdWithSecrets(payload.sub);
    if (!user || !user.isActive || !user.refreshTokenHash || user.refreshTokenId !== payload.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenValid = await this.usersService.verifySecret(user.refreshTokenHash, dto.refreshToken);
    if (!tokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.blacklistRefreshToken(payload);
    return this.issueTokens(user);
  }

  async logout(currentUser: RequestUser, dto: LogoutDto): Promise<void> {
    if (!dto.refreshToken) {
      await this.usersService.clearRefreshToken(currentUser.userId);
      return;
    }

    const payload = await this.verifyRefreshToken(dto.refreshToken);
    await this.blacklistRefreshToken(payload);

    if (payload.sub === currentUser.userId) {
      await this.usersService.clearRefreshToken(currentUser.userId);
    }
  }

  private async issueTokens(user: PublicUser): Promise<AuthTokenResponse> {
    const publicUser = toPublicUser(user as User);
    const accessSecret = this.config.getOrThrow<string>('jwt.accessSecret');
    const refreshSecret = this.config.getOrThrow<string>('jwt.refreshSecret');
    const accessTokenExpiresIn = this.config.get<string>('jwt.accessExpiresIn', '15m');
    const refreshTokenExpiresIn = this.config.get<string>('jwt.refreshExpiresIn', '7d');
    const refreshTokenId = randomUUID();
    const accessPayload: JwtPayload = {
      sub: publicUser.id,
      email: publicUser.email,
      role: publicUser.role,
    };
    const refreshPayload: Omit<RefreshJwtPayload, 'exp'> = {
      ...accessPayload,
      jti: refreshTokenId,
      type: 'refresh',
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshTokenExpiresIn,
      }),
    ]);

    await this.usersService.setRefreshToken(publicUser.id, refreshTokenId, refreshToken);

    return {
      user: publicUser,
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<RefreshJwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      });

      if (payload.type !== 'refresh' || !payload.jti) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async blacklistRefreshToken(payload: RefreshJwtPayload): Promise<void> {
    const ttl = payload.exp ? Math.max(payload.exp - Math.floor(Date.now() / 1000), 1) : 7 * 24 * 60 * 60;
    await this.redis.set(this.blacklistKey(payload.jti), '1', 'EX', ttl);
  }

  private blacklistKey(jti: string): string {
    return `auth:refresh:blacklist:${jti}`;
  }
}
