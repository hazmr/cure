import { UserRole } from '../../database/enums';

export interface RequestUser {
  userId: string;
  email: string;
  role: UserRole;
}

