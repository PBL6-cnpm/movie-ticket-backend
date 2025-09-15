import { User } from 'shared/db/entities/user.entity';

export class UserResponseDto {
  id: string;
  email: string;
  status: string;
  createdAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.status = user.status;
    this.createdAt = user.createdAt;
  }
}
