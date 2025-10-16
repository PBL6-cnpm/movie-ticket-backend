import { Entities } from '@common/enums';
import { Min } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { BookRefreshments } from './book-refreshments.entity';

@Entity(Entities.REFRESHMENTS)
export class Refreshments extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'refreshments_id' })
  id: string;

  @Column({
    name: 'name',
    nullable: false
  })
  name: string;

  @Column({ name: 'picture' })
  picture: string;

  @Column({
    name: 'price',
    type: 'int',
    nullable: false,
    default: 0
  })
  @Min(0)
  price: number;

  @Column({
    name: 'is_current',
    type: 'boolean',
    nullable: false,
    default: true
  })
  isCurrent: boolean;

  @OneToMany(() => BookRefreshments, (bookRefreshments) => bookRefreshments.refreshments, {
    cascade: true
  })
  bookRefreshmentss: BookRefreshments[];
}
