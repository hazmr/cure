import { UserRole } from '../database/enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface RefreshJwtPayload extends JwtPayload {
  jti: string;
  type: 'refresh';
  exp?: number;
}

