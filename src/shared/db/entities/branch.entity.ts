import { ENTITIES } from '@common/enums';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique
} from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { Account } from './account.entity';
import { Room } from './room.entity';

@Entity(ENTITIES.BRANCH)
@Unique(['name', 'address'])
export class Branch extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'branch_id' })
  id: string;

  @Column({ name: 'name', nullable: false })
  name: string;

  @Column({ name: 'address', nullable: false })
  address: string;

  @OneToMany(() => Account, (account) => account.branch)
  accounts: Account[];

  @OneToMany(() => Room, (room) => room.branch)
  rooms: Room[];
}
