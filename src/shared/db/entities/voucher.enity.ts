import { ENTITIES } from "@common/enums";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntityTime } from "../base-entities/base.entity";
import { Min } from "class-validator";
import { Booking } from "./booking.entity";

@Entity(ENTITIES.VOUCHER)
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

    @Column({ name: 'discount', type: 'int', nullable: false, default: 0 })
    @Min(0)
    discount: number;

    @OneToMany(() => Booking, (booking) => booking.voucher)
    bookings: Booking[];
}