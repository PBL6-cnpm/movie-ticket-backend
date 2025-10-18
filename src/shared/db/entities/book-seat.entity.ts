import { Entities } from '@common/enums';
import { Min } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { Booking } from './booking.entity';
import { Seat } from './seat.entity';
import { SpecialDate } from './special-day.entity';
import { TypeDay } from './type-day.entity';

@Entity(Entities.BOOK_SEAT)
export class BookSeat extends BaseEntityTime {
  @PrimaryColumn({ name: 'booking_id' })
  bookingId: string;

  @PrimaryColumn({ name: 'seat_id' })
  seatId: string;

  @Column({ name: 'type_day_id', nullable: true })
  typeDayId: string | null;

  @Column({ name: 'special_date_id', nullable: true })
  specialDateId: string | null;

  @Column({
    name: 'status',
    type: 'boolean',
    default: false,
    nullable: false
  })
  status: boolean;

  @Column({
    name: 'total_seat_price',
    type: 'int',
    default: 0,
    nullable: false
  })
  @Min(0)
  totalSeatPrice: number;

  @ManyToOne(() => Booking, (booking) => booking.bookSeats, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => Seat, (seat) => seat.bookSeats, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  @ManyToOne(() => TypeDay, (typeDay) => typeDay.bookSeats)
  @JoinColumn({ name: 'type_day_id' })
  typeDay: TypeDay;

  @ManyToOne(() => SpecialDate, (specialDate) => specialDate.bookSeats)
  @JoinColumn({ name: 'special_date_id' })
  specialDate: SpecialDate;
}
