import { PermissionName, RoleName } from '@common/enums';
import { RolePermissionSeed } from '@common/enums/role-permission.const';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'shared/db/entities/permission.entity';
import { RolePermission } from 'shared/db/entities/role-permission.entity';
import { Role } from 'shared/db/entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,

    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,

    @InjectRepository(RolePermission)
    private rolePermissionRepo: Repository<RolePermission>
  ) {}

  async seed() {
    this.logger.log('Starting seeding process...');
    await this.seedRoles();
    await this.seedPermissions();
    await this.seedRolePermissions();
  }

  private async seedRoles() {
    this.logger.log('Seeding roles...');
    try {
      const rolesToSeed = Object.values(RoleName).map((name) => ({
        name: name as RoleName
      }));

      await this.roleRepo.upsert(rolesToSeed, {
        skipUpdateIfNoValuesChanged: true,
        conflictPaths: ['name']
      });

      this.logger.log('Seeding roles completed.');
    } catch (error) {
      this.logger.error('Error seeding roles:', error);
    }
  }

  private async seedPermissions() {
    this.logger.log('Seeding permissions...');
    try {
      const permissionToSeed = Object.values(PermissionName).map((name) => ({
        name: name as PermissionName
      }));

      await this.permissionRepo.upsert(permissionToSeed, {
        skipUpdateIfNoValuesChanged: true,
        conflictPaths: ['name']
      });

      this.logger.log('Seeding permissions completed.');
    } catch (error) {
      this.logger.error('Error seeding permissions:', error);
    }
  }

  private async seedRolePermissions() {
    this.logger.log('Seeding role_permissionn...');
    try {
      const roles = await this.roleRepo.find();
      const permissions = await this.permissionRepo.find();

      const rolePermEntities = [];

      for (const [roleName, permList] of Object.entries(RolePermissionSeed)) {
        const role = roles.find((r) => r.name === (roleName as RoleName));
        if (!role) continue;

        for (const perName of permList) {
          const permission = permissions.find((p) => p.name === (perName as PermissionName));
          if (!permission) continue;

          rolePermEntities.push(
            this.rolePermissionRepo.create({
              role,
              permission
            })
          );
        }
      }

      await this.rolePermissionRepo.upsert(rolePermEntities, {
        conflictPaths: ['roleId', 'permissionId'],
        skipUpdateIfNoValuesChanged: true
      });

      this.logger.log('Seeding role_permission completed.');
    } catch (error) {
      this.logger.error('Error seeding role_permission: ', error);
    }
  }
}
