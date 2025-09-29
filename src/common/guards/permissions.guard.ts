import { RoleName } from '@common/enums/role.enum';
import { PermissionService } from '@modules/permissions/permission.service';
import { RoleService } from '@modules/roles/role.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Account } from 'shared/db/entities/account.entity';
import { Permission } from 'shared/db/entities/permission.entity';
import { Role } from 'shared/db/entities/role.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permissionService: PermissionService,
    private readonly roleService: RoleService
  ) {}
  async getPermissions(roles: Role[]): Promise<Permission[]> {
    return await this.permissionService.getPermissionsOfRoles(roles.map((r) => r.id));
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    const req = context.switchToHttp().getRequest();
    const user = req.user as Account & { permissions: string[] };
    const roles = user.accountRoles.map((ar) => ar?.role?.name);
    const permissions = user.permissions;
    console.log('user trong permissions guard', roles, permissions);
    if (roles.map((r) => r.toLowerCase()).includes(RoleName.SUPER_ADMIN.toLowerCase())) {
      return true;
    }
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }
    let isRoleMatch = false;
    let isPermissionMatch = false;
    if (
      !!requiredRoles &&
      requiredRoles.some((role) => roles.map((r) => r.toLowerCase()).includes(role.toLowerCase()))
    ) {
      console.log('vao day 1');
      isRoleMatch = true;
    }

    if (!!requiredPermissions && requiredPermissions.some((perm) => permissions?.includes(perm))) {
      console.log('vao day');
      isPermissionMatch = true;
    }

    return isRoleMatch && isPermissionMatch;
  }
}
