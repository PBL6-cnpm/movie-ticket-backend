import { AccountStatus } from '@common/enums/account.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Account } from 'shared/db/entities/account.entity';

export class ContextUser {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ required: false, enum: AccountStatus, default: AccountStatus.PENDING })
  status?: AccountStatus;

  @ApiProperty()
  avatarUrl: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty({ isArray: true, type: String })
  roles?: string[];

  @ApiProperty({ isArray: true, type: String })
  permissions?: string[];

  constructor(partial: Partial<Account>) {
    this.id = partial.id;
    this.fullName = partial.fullName;
    this.email = partial.email;
    this.avatarUrl = partial.avatarUrl;
    this.phoneNumber = partial.phoneNumber;
    this.status = partial.status;
  }
}
