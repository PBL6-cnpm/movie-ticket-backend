import { Entities } from '@common/enums';
import { Min } from 'class-validator';
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
  @Min(0)
  number: number;

  @Column({
    name: 'discount_percent',
    type: 'int',
    nullable: false,
    default: 0
  })
  @Min(0)
  discountPercent: number;

  @OneToMany(() => Booking, (booking) => booking.voucher, { cascade: true })
  bookings: Booking[];
}
