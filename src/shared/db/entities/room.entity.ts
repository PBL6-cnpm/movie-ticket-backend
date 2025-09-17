import { ENTITIES } from "@common/enums";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { BaseEntityTime } from "../base-entities/base.entity";
import { Branch } from "./branch.entity";
import { Seat } from "./seat.entity";
import { ShowTime } from "./show-time.entity";

@Entity(ENTITIES.ROOM)
@Unique(['branchId', 'name'])
export class Room extends BaseEntityTime {
    @PrimaryGeneratedColumn('uuid', { name: 'room_id' })
    id: string;

    @Column({ name: 'branch_id', nullable: false })
    branchId: string;

    @Column({
        name: 'name',
        unique: true,
        nullable: false,
    })
    name: string;

    @ManyToOne(() => Branch, (branch) => branch.rooms, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'branch_id' })
    branch: Branch;

    @OneToMany(() => Seat, (seat) => seat.room)
    seats: Seat[];

    @OneToMany(() => ShowTime, (showTime) => showTime.room)
    showTimes: ShowTime[];
}