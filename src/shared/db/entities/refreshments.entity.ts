import { ENTITIES } from "@common/enums";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BaseAuditedEntity } from "../base-entities/base.entity";
import { Min } from "class-validator";
import { BookRefreshments } from "./book-refreshments.entity";

@Entity(ENTITIES.REFRESHMENTS)
export class Refreshments extends BaseAuditedEntity {
    @PrimaryGeneratedColumn('uuid')
    @Column({ name: 'refreshments_id' })
    refreshmentsId: string;

    @Column({
        name: 'name',
        nullable: false,
    })
    name: string;

    @Column({
        name: 'price',
        type: 'int',
        nullable: false,
        default: 0,
    })
    @Min(0)
    price: number;

    @Column({
        name: 'is_current',
        type: 'boolean',
        nullable: false,
        default: true,
    })
    isCurrent: boolean;

    @OneToMany(() => BookRefreshments, (bookRefreshments) => bookRefreshments.refreshments)
    bookRefreshmentss: BookRefreshments[];
}