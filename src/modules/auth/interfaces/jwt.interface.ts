import { AccountRole } from 'shared/db/entities/account-role.entity';

export interface JwtPayload {
  accountId: string;
  email: string;
  avatarUrl?: string;
  roles?: AccountRole[];
  code?: string;
  iat: number;
  exp?: number;
}
