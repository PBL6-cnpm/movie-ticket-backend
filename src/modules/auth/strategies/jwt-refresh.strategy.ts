import { COOKIE_NAMES, REDIS_KEYS, RESPONSE_MESSAGES } from '@common/constants';
import { AccountStatus } from '@common/enums';
import { Unauthorized } from '@common/exceptions';
import { ContextUser } from '@common/types/user.type';
import { JWT } from '@configs/env.config';
import { AccountService } from '@modules/accounts/account.service';
import { PermissionService } from '@modules/permissions/permission.service';
import { RoleService } from '@modules/roles/role.service';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { RedisService } from '@shared/modules/redis/redis.service';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly redisService: RedisService,
    private readonly accountService: AccountService,
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token =
            (req.body?.refreshToken as string) ||
            (req.cookies[COOKIE_NAMES.REFRESH_TOKEN] as string);

          if (token) {
            req.refreshToken = token;
          }

          return token;
        }
      ]),
      secretOrKey: JWT.secret,
      passReqToCallback: true
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.refreshToken;

    const isMember = await this.redisService.isMemberOfSet(
      REDIS_KEYS.USER_SESSIONS(payload.accountId),
      refreshToken
    );

    const account = await this.accountService.getAccountById(payload.accountId);

    if (!account || !isMember || account.status === AccountStatus.DELETED) {
      throw new Unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED);
    }

    // Fetch roles using RoleService
    const roleEntities = await this.roleService.getRolesOfUser(account.id);
    const permissions = await this.permissionService.getPermissionsOfRoles(
      roleEntities.map((r) => r.id)
    );

    const userContext: ContextUser = {
      id: account.id,
      email: account.email,
      fullName: account.fullName,
      status: account.status,
      avatarUrl: account?.avatarUrl ?? '',
      phoneNumber: account?.phoneNumber ?? '',
      roles: roleEntities.map((r) => r.name),
      permissions: permissions.map((p) => p.name)
    };

    return userContext;
  }
}
