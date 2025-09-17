import { ENTITIES } from '@common/enums';
import { DayOfWeek } from '@common/enums/type-day.enum';
import { Min } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import {
  BaseAuditedEntity,
  BaseEntityTime
} from '../base-entities/base.entity';
import { BookSeat } from './book-seat.entity';

@Entity(ENTITIES.TYPE_DAY)
export class TypeDay extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'type_day_id' })
  id: string;

  @Column({
    name: 'day_of_week',
    type: 'enum',
    enum: DayOfWeek
  })
  dayOfWeek: DayOfWeek;

  @Column({
    name: 'additional_price',
    type: 'int',
    default: 0
  })
  @Min(0)
  additionalPrice: number;

  @Column({
    name: 'is_current',
    type: 'boolean',
    default: true
  })
  isCurrent: boolean;

  @OneToMany(() => BookSeat, (bookSeat) => bookSeat.typeDay)
  bookSeats: BookSeat;
}
