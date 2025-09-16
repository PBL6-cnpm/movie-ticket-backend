import { ENTITIES } from "@common/enums";
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { BaseEntityTime } from "../base-entities/base.entity";
import { Role } from "./role.entity";
import { Permission } from "./permission.entity";

@Entity(ENTITIES.ROLE_PERMISSION)
export class RolePermission extends BaseEntityTime {
    @PrimaryColumn({ name: 'role_id' })
    roleId: string;

    @PrimaryColumn({ name: 'permission_id' })
    permissionId: string;

    @ManyToOne(() => Role, (role) => role.rolePermissions, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @ManyToOne(() => Permission, (permission) => permission.rolePermissions, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'permission_id' })
    permission: Permission;
}