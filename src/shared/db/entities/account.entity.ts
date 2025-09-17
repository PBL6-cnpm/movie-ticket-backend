import { ENTITIES } from '@common/enums';
import { Min } from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { AccountStatus } from '@common/enums/account.enum';
import { Booking } from './booking.entity';
import { Branch } from './branch.entity';
import { Review } from './review.entity';
import { Role } from './role.entity';

@Entity(ENTITIES.ACCOUNT)
export class Account extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'account_id' })
  id: string;

  @Column({ name: 'role_id', nullable: false })
  roleId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({
    name: 'email',
    unique: true,
    nullable: false
  })
  email: string;

  @Column({ name: 'password', nullable: false })
  password: string;

  @Column({
    name: 'coin',
    type: 'int',
    default: 0,
    nullable: false
  })
  @Min(0)
  coin: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.PENDING
  })
  status: AccountStatus;

  @ManyToOne(() => Role, (role) => role.accounts, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Branch, (branch) => branch.accounts)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @OneToMany(() => Review, (review) => review.account)
  reviews: Review[];

  @OneToMany(() => Booking, (booking) => booking.account)
  bookings: Booking[];
}
