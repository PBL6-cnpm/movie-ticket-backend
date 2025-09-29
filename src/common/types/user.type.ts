import { AccountStatus } from '@common/enums/account.enum';
import { ApiProperty } from '@nestjs/swagger';
import { AccountRole } from 'shared/db/entities/account-role.entity';
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

  @ApiProperty({ isArray: true, type: AccountRole })
  roles?: AccountRole[];

  @ApiProperty({ isArray: true, type: String })
  permissions?: string[];

  @ApiProperty({ required: false, enum: AccountStatus, default: AccountStatus.PENDING })
  status?: AccountStatus;

  tokenId: string;

  constructor(partial: Partial<Account>) {
    this.id = partial.id;
    this.fullname = partial.fullName;
    this.email = partial.email;
    this.avatarUrl = partial.avatarUrl;
    this.phoneNumber = partial.phoneNumber;
    this.status = partial.status;
  }
}
