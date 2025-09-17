import { ENTITIES } from "@common/enums";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { BaseEntityTime } from "../base-entities/base.entity";
import { Room } from "./room.entity";
import { TypeSeat } from "./type-seat.entity";
import { BookSeat } from "./book-seat.entity";

@Entity(ENTITIES.SEAT)
@Unique(['roomId', 'name'])
export class Seat extends BaseEntityTime {
    @PrimaryGeneratedColumn('uuid', { name: 'seat_id' })
    id: string;

    @Column({ name: 'room_id', nullable: false })
    roomId: string;

    @Column({ name: 'type_seat_id', nullable: false })
    typeSeatId: string;

    @Column({ name: 'name', nullable: false })
    name: string;

    @ManyToOne(() => Room, (room) => room.seats, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'room_id' })
    room: Room;

    @ManyToOne(() => TypeSeat, (typeSeat) => typeSeat.seats, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'type_seat_id' })
    typeSeat: TypeSeat;

    @OneToMany(() => BookSeat, (bookSeat) => bookSeat.seat)
    bookSeats: BookSeat[];
}