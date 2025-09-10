import { User } from '@modules/users/entities/user.entity';

export interface RegisterResponse {
  verificationToken: string;
  user: User;
}

export interface LoginResponse {
  accessToken: string;
}
