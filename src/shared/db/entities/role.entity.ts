import { RoleName } from "@common/enums/role.enum";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntityTime } from "../base-entities/base.entity";
import { ENTITIES } from "@common/enums";
import { RolePermission } from "./role-permission.entity";
import { Account } from "./account.entity";

@Entity(ENTITIES.ROLE)
export class Role extends BaseEntityTime {
    @PrimaryGeneratedColumn('uuid')
    @Column({ name: 'role_id' })
    id: string;

    @Column({ 
        name: 'name',
        type: 'enum',
        enum: RoleName,
        unique: true,
        nullable: false,
    })
    name: RoleName;

    @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
    rolePermissions: RolePermission[];

    @OneToMany(() => Account, (account) => account.role)
    accounts: Account[];
}