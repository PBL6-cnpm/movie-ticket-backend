import { Entities, PermissionName } from '@common/enums';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { RolePermission } from './role-permission.entity';

@Entity(Entities.PERMISSION)
export class Permission extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'permission_id' })
  id: string;

  @Column({
    name: 'name',
    type: 'enum',
    enum: PermissionName,
    nullable: false,
    unique: true
  })
  name: PermissionName;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission, { cascade: true })
  rolePermissions: RolePermission[];
}
