import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserRole } from '../database/enums';
import { UsersService } from '../users/users.service';

const publicUser = {
  id: 'user-id',
  email: 'patient@cure.local',
  firstName: 'Pat',
  lastName: 'Patient',
  role: UserRole.PATIENT,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  patientProfiles: [],
  assignedPatients: [],
  assignedBookings: [],
  clinicalNotes: [],
};

describe('AuthService', () => {
  const config = {
    getOrThrow: jest.fn((key: string) =>
      key === 'jwt.accessSecret' ? 'access-secret-at-least-32-characters' : 'refresh-secret-at-least-32-characters',
    ),
    get: jest.fn((key: string, fallback: string) => {
      if (key === 'jwt.accessExpiresIn') {
        return '15m';
      }
      if (key === 'jwt.refreshExpiresIn') {
        return '7d';
      }
      return fallback;
    }),
  };

  function createService(overrides: Partial<UsersService> = {}) {
    const usersService = {
      create: jest.fn().mockResolvedValue(publicUser),
      findByEmail: jest.fn(),
      findByIdWithSecrets: jest.fn(),
      verifySecret: jest.fn(),
      setRefreshToken: jest.fn().mockResolvedValue(undefined),
      clearRefreshToken: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    } as unknown as UsersService;
    const jwtService = {
      signAsync: jest.fn(async (payload: { type?: string }) =>
        payload.type === 'refresh' ? 'refresh-token' : 'access-token',
      ),
      verifyAsync: jest.fn(),
    } as unknown as JwtService;
    const redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    };

    return {
      service: new AuthService(usersService, jwtService, config as never, redis as never),
      usersService,
      jwtService,
      redis,
    };
  }

  it('rejects invalid login credentials', async () => {
    const { service } = createService({
      findByEmail: jest.fn().mockResolvedValue({
        ...publicUser,
        passwordHash: 'hash',
      }),
      verifySecret: jest.fn().mockResolvedValue(false),
    } as Partial<UsersService>);

    await expect(
      service.login({ email: 'patient@cure.local', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('issues and stores refresh tokens after password validation', async () => {
    const { service, usersService } = createService({
      findByEmail: jest.fn().mockResolvedValue({
        ...publicUser,
        passwordHash: 'hash',
        refreshTokenHash: 'refresh-hash',
        refreshTokenId: 'refresh-id',
      }),
      verifySecret: jest.fn().mockResolvedValue(true),
    } as Partial<UsersService>);

    const result = await service.login({
      email: 'patient@cure.local',
      password: 'valid-password',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.user).not.toHaveProperty('refreshTokenHash');
    expect(result.user).not.toHaveProperty('refreshTokenId');
    expect(usersService.setRefreshToken).toHaveBeenCalledWith(
      publicUser.id,
      expect.any(String),
      'refresh-token',
    );
  });

  it('rotates refresh tokens and blacklists the old token id', async () => {
    const payload = {
      sub: publicUser.id,
      email: publicUser.email,
      role: publicUser.role,
      jti: 'old-refresh-id',
      type: 'refresh' as const,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const { service, jwtService, usersService, redis } = createService({
      findByIdWithSecrets: jest.fn().mockResolvedValue({
        ...publicUser,
        refreshTokenHash: 'stored-hash',
        refreshTokenId: 'old-refresh-id',
      }),
      verifySecret: jest.fn().mockResolvedValue(true),
    } as Partial<UsersService>);
    jest.mocked(jwtService.verifyAsync).mockResolvedValue(payload);

    const result = await service.refresh({ refreshToken: 'old-refresh-token' });

    expect(result.refreshToken).toBe('refresh-token');
    expect(redis.set).toHaveBeenCalledWith(
      'auth:refresh:blacklist:old-refresh-id',
      '1',
      'EX',
      expect.any(Number),
    );
    expect(usersService.setRefreshToken).toHaveBeenCalledWith(
      publicUser.id,
      expect.any(String),
      'refresh-token',
    );
  });

  it('rejects blacklisted refresh tokens', async () => {
    const { service, jwtService, redis } = createService();
    jest.mocked(jwtService.verifyAsync).mockResolvedValue({
      sub: publicUser.id,
      email: publicUser.email,
      role: publicUser.role,
      jti: 'old-refresh-id',
      type: 'refresh',
    });
    jest.mocked(redis.get).mockResolvedValue('1');

    await expect(service.refresh({ refreshToken: 'old-refresh-token' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
