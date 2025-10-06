import { Entities } from '@common/enums';
import { Min } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { Seat } from './seat.entity';

@Entity(Entities.TYPE_SEAT)
export class TypeSeat extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'type_seat_id' })
  id: string;

  @Column({
    name: 'name',
    unique: true,
    nullable: false
  })
  name: string;

  @Column({
    name: 'price',
    type: 'int',
    nullable: false
  })
  @Min(0)
  price: number;

  @Column({
    name: 'is_current',
    type: 'boolean',
    default: true
  })
  isCurrent: boolean;

  @OneToMany(() => Seat, (seat) => seat.typeSeat, { cascade: true })
  seats: Seat[];
}
