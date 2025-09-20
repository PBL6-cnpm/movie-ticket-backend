import { Account } from 'shared/db/entities/account.entity';

export class UserResponseDto {
  id: string;
  email: string;
  status: string;
  createdAt: Date;

  constructor(user: Account) {
    this.id = user.id;
    this.email = user.email;
    this.status = user.status;
    this.createdAt = user.createdAt;
  }
}
