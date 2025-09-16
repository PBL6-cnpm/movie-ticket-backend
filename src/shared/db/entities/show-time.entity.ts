import { ENTITIES } from "@common/enums";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { BaseEntityTime } from "../base-entities/base.entity";
import { Booking } from "./booking.entity";
import { Movie } from "./movie.entity";
import { Room } from "./room.entity";

@Entity(ENTITIES.SHOW_TIME)
@Unique(['room_id', 'time_start', 'show_date'])
export class ShowTime extends BaseEntityTime {
    @PrimaryGeneratedColumn('uuid')
    @Column({ name: 'show_time_id' })
    id: string;

    @Column({ name: 'movie_id', nullable: false })
    movieId: string;

    @Column({ name: 'room_id', nullable: false })
    roomId: string;

    @Column({
        name: 'time_start',
        type: 'time',
        nullable: false,
    })
    timeStart: string;

    @Column({
        name: 'show_date',
        type: 'date',
        nullable: false,
    })
    showDate: string;

    @ManyToOne(() => Movie, (movie) => movie.showTimes, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'movie_id' })
    movie: Movie;

    @ManyToOne(() => Room, (room) => room.showTimes, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'room_id' })
    room: Room;

    @OneToMany(() => Booking, (booking) => booking.showTime)
    bookings: Booking[];
}