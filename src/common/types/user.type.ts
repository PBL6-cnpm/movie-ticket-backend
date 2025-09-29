import { AccountStatus } from '@common/enums/account.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Account } from 'shared/db/entities/account.entity';

export class IContextUser {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullname: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  avatarUrl: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty({ isArray: true, type: String })
  roles?: string[];

  @ApiProperty({ isArray: true, type: String })
  permissions?: string[];

  @ApiProperty({ required: false, enum: AccountStatus, default: AccountStatus.PENDING })
  status?: AccountStatus;

  constructor(partial: Partial<Account>) {
    this.id = partial.id;
    this.fullname = partial.fullName;
    this.email = partial.email;
    this.avatarUrl = partial.avatarUrl;
    this.phoneNumber = partial.phoneNumber;
    this.status = partial.status;
  }
}
