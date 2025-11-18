import { Entities } from '@common/enums';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from './account.entity';
import { Role } from './role.entity';

@Entity({ name: Entities.ACCOUNT_ROLE })
export class AccountRole {
  @PrimaryGeneratedColumn('uuid', { name: 'account_role_id' })
  accountRoleId: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @Column({ name: 'role_id' })
  roleId: string;

  @ManyToOne(() => Account, (account) => account.accountRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => Role, (role) => role.accountRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
