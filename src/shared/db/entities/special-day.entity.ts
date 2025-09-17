import { ENTITIES } from "@common/enums";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BaseAuditedEntity } from "../base-entities/base.entity";
import { Min } from "class-validator";
import { BookSeat } from "./book-seat.entity";

@Entity(ENTITIES.SPECIAL_DAY)
export class SpecialDay extends BaseAuditedEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'special_day_id' })
    id: string;

    @Column({
        name: 'date',
        type: 'date',
        unique:  true,
        nullable: false,
    })
    date: string;

    @Column({
        name: 'additional_price',
        type: 'int',
        default: 0,
        nullable: false,
    })
    @Min(0)
    additionalPrice: number;

    @OneToMany(() => BookSeat, (bookSeat) => bookSeat.specialDay)
    bookSeats: BookSeat[];
}