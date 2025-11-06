import { Entities } from '@common/enums';
import { Min } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { Booking } from './booking.entity';
import { Refreshments } from './refreshments.entity';

@Entity(Entities.BOOK_REFRESHMENTS)
export class BookRefreshments extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'book_refreshments_id' })
  id: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @Column({ name: 'refreshments_id', nullable: false })
  refreshmentsId: string;

  @Column({
    name: 'quantity',
    type: 'int',
    default: 1,
    nullable: false
  })
  @Min(1)
  quantity: number;

  @Column({
    name: 'total_price',
    type: 'int',
    nullable: false,
    default: 0
  })
  @Min(0)
  totalPrice: number;

  @ManyToOne(() => Booking, (booking) => booking.bookRefreshmentss)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => Refreshments, (refreshments) => refreshments.bookRefreshmentss, {
    nullable: false
  })
  @JoinColumn({ name: 'refreshments_id' })
  refreshments: Refreshments;
}
