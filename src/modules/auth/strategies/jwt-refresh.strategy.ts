import { COOKIE_NAMES } from '@common/constants/cookie.constant';
import { REDIS_KEYS } from '@common/constants/redis.constant';
import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { AccountStatus } from '@common/enums';
import { Unauthorized } from '@common/exceptions/unauthorized.exception';
import { JWT } from '@configs/env.config';
import { AccountService } from '@modules/accounts/account.service';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from 'shared/modules/redis/redis.service';
import { JwtPayload } from '../interfaces/jwtPayload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly redisService: RedisService,
    private readonly accountService: AccountService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req.cookies[COOKIE_NAMES.REFRESH_TOKEN] as string;
        }
      ]),
      secretOrKey: JWT.secret,
      passReqToCallback: true
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN] as string;

    const isMember = await this.redisService.isMemberOfSet(
      REDIS_KEYS.USER_SESSIONS(payload.accountId),
      refreshToken
    );

    const account = await this.accountService.getAccountById(payload.accountId);

    if (!account || !isMember || account.status === AccountStatus.DELETED) {
      throw new Unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED);
    }

    return {
      accountId: account.id,
      email: account.email
    };
  }
}
