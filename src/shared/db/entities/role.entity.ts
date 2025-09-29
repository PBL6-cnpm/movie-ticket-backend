import { Entities, RoleName } from '@common/enums';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntityTime } from '../base-entities/base.entity';
import { AccountRole } from './account-role.entity';
import { RolePermission } from './role-permission.entity';

@Entity(Entities.ROLE)
export class Role extends BaseEntityTime {
  @PrimaryGeneratedColumn('uuid', { name: 'role_id' })
  id: string;

  @Column({
    name: 'name',
    type: 'enum',
    enum: RoleName,
    unique: true,
    nullable: false
  })
  name: RoleName;

  @OneToMany(() => AccountRole, (accountRole) => accountRole.role)
  accountRoles: AccountRole[];

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];
}
