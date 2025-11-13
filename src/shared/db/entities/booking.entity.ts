import { Entities } from '@common/enums';
import { BookingStatus } from '@common/enums/booking.enum';
import { Min } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { Account } from './account.entity';
import { BookRefreshments } from './book-refreshments.entity';
import { BookSeat } from './book-seat.entity';
import { ShowTime } from './show-time.entity';
import { Voucher } from './voucher.entity';

@Entity(Entities.BOOKING)
export class Booking extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'booking_id' })
  id: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @Column({ name: 'voucher_id', nullable: true })
  voucherId: string | null;

  @Column({ name: 'qr_url', nullable: true })
  qrUrl: string | null;

  @Column({ name: 'show_time_id', nullable: false })
  showTimeId: string;

  @Column({ name: 'payment_intent_id', nullable: true })
  paymentIntentId: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING
  })
  status: BookingStatus;

  @Column({ name: 'check_in_status', default: false })
  checkInStatus: boolean;

  @Column({
    name: 'total_booking_price',
    type: 'int',
    default: 0,
    nullable: false
  })
  @Min(0)
  totalBookingPrice: number;

  @Column({
    name: 'date_time_booking',
    type: 'timestamp',
    nullable: false
  })
  dateTimeBooking: Date;

  @OneToMany(() => BookSeat, (bookSeat) => bookSeat.booking, { cascade: true })
  bookSeats: BookSeat[];

  @ManyToOne(() => Account, (account) => account.bookings)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => Voucher, (voucher) => voucher.bookings, { nullable: true })
  @JoinColumn({ name: 'voucher_id' })
  voucher: Voucher | null;

  @ManyToOne(() => ShowTime, (showTime) => showTime.bookings, {
    nullable: false
  })
  @JoinColumn({ name: 'show_time_id' })
  showTime: ShowTime;

  @OneToMany(() => BookRefreshments, (bookRefreshments) => bookRefreshments.booking, {
    cascade: true
  })
  bookRefreshmentss: BookRefreshments[];
}
