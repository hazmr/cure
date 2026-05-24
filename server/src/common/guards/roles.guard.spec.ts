import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../database/enums';
import { RolesGuard } from './roles.guard';

function createContext(role?: UserRole): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: role
          ? {
              userId: 'user-id',
              email: 'user@cure.local',
              role,
            }
          : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows matching roles', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext(UserRole.ADMIN))).toBe(true);
  });

  it('rejects missing or mismatched roles', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(createContext(UserRole.PATIENT))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(createContext())).toThrow(ForbiddenException);
  });
});

