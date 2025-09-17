import { ENTITIES } from "@common/enums";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { BaseEntityTime } from "../base-entities/base.entity";
import { BookSeat } from "./book-seat.entity";
import { Account } from "./account.entity";
import { ShowTime } from "./show-time.entity";
import { Min } from "class-validator";
import { BookRefreshments } from "./book-refreshments.entity";
import { Voucher } from "./voucher.enity";

@Entity(ENTITIES.BOOKING)
@Unique(['accountId', 'voucherId'])
export class Booking extends BaseEntityTime {
    @PrimaryGeneratedColumn('uuid', { name: 'booking_id' })
    id: string;

    @Column({ name: 'account_id' })
    accountId: string;

    @Column({ name: 'voucher_id' })
    voucherId: string;

    @Column({ name: 'show_time_id', nullable: false })
    showTimeId: string;

    @Column({
        name: 'total_booking_price',
        type: 'int',
        default: 0,
        nullable: false,
    })
    @Min(0)
    totalBookingPrice: number;

    @Column({
        name: 'date_time_booking',
        type: 'datetime',
        nullable: false,
    })
    dateTimeBooking: Date;

    @OneToMany(() => BookSeat, (bookSeat) => bookSeat.booking)
    bookSeats: BookSeat[];

    @ManyToOne(() => Account, (account) => account.bookings)
    @JoinColumn({ name: 'account_id' })
    account: Account;

    @ManyToOne(() => Voucher, (voucher) => voucher.bookings)
    @JoinColumn({ name: 'voucher_id' })
    voucher: Voucher;

    @ManyToOne(() => ShowTime, (showTime) => showTime.bookings, { nullable: false })
    @JoinColumn({ name: 'show_time_id' })
    showTime: ShowTime;

    @OneToMany(() => BookRefreshments, (bookRefreshments) => bookRefreshments.booking)
    bookRefreshmentss: BookRefreshments[];
}