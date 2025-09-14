import { ENTITIES } from '@common/enums';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserStatus } from '../../../modules/users/enums/user.enum';
import { BaseEntityTime } from '../base-entities/base.entity';

@Entity(ENTITIES.USER)
export class User extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'email', unique: true })
  email: string;

  @Column({ name: 'password' })
  password: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.INACTIVE
  })
  status: UserStatus;
}
