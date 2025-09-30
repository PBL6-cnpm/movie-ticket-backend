import { AccountStatus } from '@common/enums';
import { Account } from 'shared/db/entities/account.entity';

export class AccountResponseDto {
  id: string;
  email: string;
  status: AccountStatus;
  branchId: string;
  coin: number;
  avatarUrl: string;
  phoneNumber: string;
  createdAt: Date;
  roleNames: string[];

  constructor(account: Account, roleNames?: string[]) {
    this.id = account.id;
    this.email = account.email;
    this.status = account.status;
    this.branchId = account.branchId;
    this.coin = account.coin;
    this.avatarUrl = account.avatarUrl;
    this.phoneNumber = account.phoneNumber;
    this.createdAt = account.createdAt;
    this.roleNames = account.accountRoles?.map((ar) => ar.role.name) ?? roleNames;
  }
}
