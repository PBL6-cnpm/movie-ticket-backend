import { Entities } from '@common/enums';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { Booking } from './booking.entity';

@Entity(Entities.VOUCHER)
export class Voucher extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'voucher_id' })
  id: string;

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ name: 'code', nullable: false, unique: true })
  code: string;

  @Column({ name: 'number', type: 'int', nullable: false, default: 0 })
  number: number;

  @Column({
    name: 'discount_percent',
    type: 'int',
    nullable: true
  })
  discountPercent: number | null;

  @Column({
    name: 'max_discount_value',
    type: 'int',
    nullable: true
  })
  maxDiscountValue: number | null;

  @Column({
    name: 'discount_value',
    type: 'int',
    nullable: true
  })
  discountValue: number | null;

  @Column({
    name: 'minimum_order_value',
    type: 'int',
    nullable: true
  })
  minimumOrderValue: number | null;

  @Column({
    name: 'valid_from',
    type: 'timestamp',
    nullable: true,
    default: null
  })
  validFrom: Date | null;

  @Column({
    name: 'valid_to',
    type: 'timestamp',
    nullable: true,
    default: null
  })
  validTo: Date | null;

  @Column({
    name: 'is_private',
    type: 'boolean',
    default: false
  })
  isPrivate: boolean;

  @OneToMany(() => Booking, (booking) => booking.voucher, { cascade: true })
  bookings: Booking[];
}
