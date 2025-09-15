import { User } from 'shared/db/entities/user.entity';

export interface RegisterResponse {
  verificationToken: string;
  user: User;
}

export interface LoginResponse {
  accessToken: string;
}
