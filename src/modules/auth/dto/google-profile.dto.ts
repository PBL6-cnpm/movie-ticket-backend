import { TokenPayload } from 'google-auth-library';

export class GoogleProfileDto {
  email: string;
  fullName: string;
  avatarUrl: string;

  constructor(payload: TokenPayload) {
    this.email = payload.email;
    this.fullName = payload.name;
    this.avatarUrl = payload.picture;
  }
}
