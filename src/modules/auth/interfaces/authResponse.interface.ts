import { AccountResponseDto } from '@modules/accounts/dto/account-response.dto';

export interface RegisterResponse {
  verificationToken: string;
  account: AccountResponseDto;
}

export interface LoginResponse {
  verificationToken?: string;
  accessToken?: string;
  account: AccountResponseDto;
}

export interface ResendEmailVerificationResponse {
  verificationToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}
