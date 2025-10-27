import { AccountResponseDto } from '@modules/accounts/dto/account-response.dto';

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  account: AccountResponseDto;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
