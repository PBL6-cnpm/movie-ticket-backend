import { AccountStatus, Entities } from '@common/enums';
import { Min } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { AccountRole } from './account-role.entity';
import { Booking } from './booking.entity';
import { Branch } from './branch.entity';
import { Review } from './review.entity';

@Entity(Entities.ACCOUNT)
export class Account extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'account_id' })
  id: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'branch_id', nullable: true })
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

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.PENDING
  })
  status: AccountStatus;

  @Column({ name: 'stripe_customer_id', nullable: true })
  stripeCustomerId: string;

  @OneToMany(() => AccountRole, (accountRole) => accountRole.account, { cascade: true })
  accountRoles: AccountRole[];

  @ManyToOne(() => Branch, (branch) => branch.accounts)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @OneToMany(() => Review, (review) => review.account, { cascade: true })
  reviews: Review[];

  @OneToMany(() => Booking, (booking) => booking.account, { cascade: true })
  bookings: Booking[];
}
