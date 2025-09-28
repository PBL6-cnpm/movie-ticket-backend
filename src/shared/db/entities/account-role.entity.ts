import { Entities } from '@common/enums';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { Account } from './account.entity';
import { Role } from './role.entity';

@Entity(Entities.ACCOUNT_ROLE)
export class AccountRole extends BaseEntityTime {
  @PrimaryColumn({ name: 'account_id' })
  accountId: string;

  @PrimaryColumn({ name: 'role_id' })
  roleId: string;

  @ManyToOne(() => Account, (account) => account.accountRoles)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => Role, (role) => role.accountRoles)
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
