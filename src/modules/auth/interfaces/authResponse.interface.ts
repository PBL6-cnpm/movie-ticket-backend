import { AccountResponseDto } from '@modules/accounts/dto/account-response.dto';

export interface LoginResponse {
  accessToken?: string;
  message?: string;
  account: AccountResponseDto;
}

export interface RefreshTokenResponse {
  accessToken: string;
}
