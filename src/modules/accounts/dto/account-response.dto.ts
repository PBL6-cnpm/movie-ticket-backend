import { AccountStatus } from '@common/enums';
import { Account } from 'shared/db/entities/account.entity';

export class AccountResponseDto {
  id: string;
  email: string;
  status: AccountStatus;
  roleName: string;
  branchId: string;
  coin: number;
  createdAt: Date;

  constructor(account: Account, roleName?: string) {
    this.id = account.id;
    this.email = account.email;
    this.status = account.status;
    this.roleName = account.role?.name || roleName;
    this.branchId = account.branchId;
    this.coin = account.coin;
    this.createdAt = account.createdAt;
  }
}
