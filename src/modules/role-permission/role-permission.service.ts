import { BaseService } from '@bases/base-service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RolePermission } from 'shared/db/entities/role-permission.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolePermissionService extends BaseService<RolePermission> {
  constructor(
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>
  ) {
    super(rolePermissionRepo);
  }

  async savePermissionInRole(rolePermEntities: RolePermission[]) {
    return await this.rolePermissionRepo.upsert(rolePermEntities, {
      conflictPaths: ['roleId', 'permissionId'],
      skipUpdateIfNoValuesChanged: true
    });
  }
}
