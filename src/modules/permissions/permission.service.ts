import { BaseService } from '@bases/base-service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from '@shared/db/entities/permission.entity';
import { RolePermission } from '@shared/db/entities/role-permission.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionService extends BaseService<Permission> {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>
  ) {
    super(permissionRepo);
  }

  async getPermissionsOfRoles(roleIds: string[]): Promise<Permission[]> {
    if (!roleIds.length) return [];
    return this.permissionRepo
      .createQueryBuilder('permission')
      .innerJoin(
        'permission.rolePermissions',
        'rolePermission',
        'rolePermission.roleId IN (:...roleIds)',
        { roleIds }
      )
      .getMany();
  }
}
