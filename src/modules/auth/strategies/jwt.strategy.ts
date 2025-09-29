import { REDIS_KEYS } from '@common/constants/redis.constant';
import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { AccountStatus } from '@common/enums';
import { Unauthorized } from '@common/exceptions/unauthorized.exception';
import { JWT } from '@configs/env.config';
import { AccountService } from '@modules/accounts/account.service';
import { RoleService } from '@modules/roles/role.service';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from 'shared/modules/redis/redis.service';
import { JwtPayload } from '../interfaces/jwt.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly redisService: RedisService,
    private readonly accountService: AccountService,
    private readonly roleService: RoleService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT.secret,
      passReqToCallback: true
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    // Check blacklist
    const isBlacklisted = await this.redisService.get(REDIS_KEYS.BLACKLIST(token));
    if (isBlacklisted) {
      throw new Unauthorized(RESPONSE_MESSAGES.ALREADY_LOGGED_OUT);
    }

    const account = await this.accountService.getAccountById(payload.accountId);

    if (!account || account.status === AccountStatus.DELETED) {
      throw new Unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED);
    }

    // Fetch roles using RoleService
    const roleEntities = await this.roleService.getRolesOfUser(account.id);
    const roles = roleEntities.map((r) => r.name);

    return {
      accountId: account.id,
      email: account.email,
      avatarUrl: account.avatarUrl,
      roles
    };
  }
}
