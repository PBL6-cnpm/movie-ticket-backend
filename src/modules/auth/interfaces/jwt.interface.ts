import { RoleName } from '@common/enums/role.enum';
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

export interface JwtClaims {
  type: 'refresh' | 'access';
  accountId: string;
  jti: string;
  role: RoleName;
}
