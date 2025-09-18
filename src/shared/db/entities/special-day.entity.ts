import { ENTITIES } from '@common/enums';
import { Min } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { BookSeat } from './book-seat.entity';

@Entity(ENTITIES.SPECIAL_DATE)
export class SpecialDate extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'special_date_id' })
  id: string;

  @Column({
    name: 'date',
    type: 'timestamp',
    unique: true,
    nullable: false
  })
  date: Date;

  @Column({
    name: 'additional_price',
    type: 'int',
    default: 0,
    nullable: false
  })
  @Min(0)
  additionalPrice: number;

  @OneToMany(() => BookSeat, (bookSeat) => bookSeat.specialDate, {
    nullable: true
  })
  bookSeats: BookSeat[];
}
