import { Account } from 'shared/db/entities/account.entity';

export interface RegisterResponse {
  verificationToken: string;
  user: Account;
}

export interface LoginResponse {
  accessToken: string;
}
