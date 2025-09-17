import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntityTime } from "../base-entities/base.entity";
import { ENTITIES } from "@common/enums";
import { PermissionName } from "@common/enums/permission.enum";
import { RolePermission } from "./role-permission.entity";

@Entity(ENTITIES.PERMISSION)
export class Permission extends BaseEntityTime {
    @PrimaryGeneratedColumn('uuid', { name: 'permission_id' })
    id: string;

    @Column({ 
        name: 'name', 
        type: 'enum',
        enum: PermissionName,
        nullable: false,
        unique: true,
    })
    name: PermissionName;

    @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
    rolePermissions: RolePermission[];
}