import { User } from '../../database/user.entity';

export type PublicUser = Omit<User, 'passwordHash' | 'refreshTokenHash' | 'refreshTokenId'>;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, refreshTokenHash: _refreshTokenHash, refreshTokenId: _refreshTokenId, ...safeUser } =
    user as User;
  return safeUser;
}

