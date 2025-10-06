import { RoleName } from '@common/enums/role.enum';
import { PermissionService } from '@modules/permissions/permission.service';
import { RoleService } from '@modules/roles/role.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '@shared/db/entities/permission.entity';
import { Role } from '@shared/db/entities/role.entity';
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

    const user = req.user;
    const roles: string[] = user?.roles ?? [];
    const permissions: string[] = user?.permissions ?? [];
    if (roles.map((r: string) => r?.toLowerCase()).includes(RoleName.SUPER_ADMIN.toLowerCase())) {
      return true;
    }

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    let isRoleMatch = false;
    let isPermissionMatch = false;

    if (
      Array.isArray(requiredRoles) &&
      requiredRoles.some((role) => roles.map((r) => r?.toLowerCase()).includes(role.toLowerCase()))
    ) {
      isRoleMatch = true;
    }

    if (
      Array.isArray(requiredPermissions) &&
      requiredPermissions.some((perm) => permissions.includes(perm))
    ) {
      isPermissionMatch = true;
    }

    return isRoleMatch || isPermissionMatch;
  }
}
