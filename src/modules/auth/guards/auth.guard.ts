import { userContextCacheKey } from '@common/constants/auth.constant';
import { MESSAGE_KEY } from '@common/constants/base.constant';
import { AccountStatus } from '@common/enums/account.enum';
import { IContextUser } from '@common/types/user.type';
import { PermissionService } from '@modules/permissions/permission.service';
import { RoleService } from '@modules/roles/role.service';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'shared/modules/redis/redis.service';
import { JwtClaims } from '../interfaces/jwt.interface';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { authorization } = request.headers || {};
    if (!authorization) throw new UnauthorizedException(MESSAGE_KEY.TOKEN_IS_EMPTY);
    const token: string = authorization.replace('Bearer ', '');

    const info = this.jwtService.decode<JwtClaims>(token);

    if (!info) throw new UnauthorizedException(MESSAGE_KEY.INVALID_TOKEN);

    const userContext: IContextUser = await this.validateUser(info);

    if (!userContext) throw new ForbiddenException(MESSAGE_KEY.INVALID_TOKEN);

    // Lấy role và permission từ DB hoặc cache
    const roles = await this.roleService.getRolesOfUser(userContext.id);
    const permissions = await this.permissionService.getPermissionsOfRoles(roles.map((r) => r.id));

    userContext.permissions = permissions.map((p) => p.name);

    request.user = userContext;
    return true;
  }

  async validateUser(payload: JwtClaims): Promise<IContextUser> {
    console.log('vao day', payload);

    const user = await this.redis.get<IContextUser>(userContextCacheKey(payload.accountId));
    if (!user) throw new UnauthorizedException({ code: 'USER_CONTEXT_NOT_FOUND' });

    if (user.status === AccountStatus.DELETED)
      throw new ForbiddenException(MESSAGE_KEY.USER_IS_DISABLED);
    if (user.status === AccountStatus.PENDING)
      throw new ForbiddenException(MESSAGE_KEY.USER_IS_BLOCKED);

    user.tokenId = payload.jti;
    return user;
  }
}
