import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwtPayload.interface';
import { AccountService } from '@modules/accounts/account.service';
import { COOKIE_NAMES } from '@common/constants/cookie.constant';
import { RedisService } from 'shared/modules/redis/redis.service';
import { REDIS_KEYS } from 'shared/modules/redis/redis.constant';
import { Unauthorized } from '@common/exceptions/unauthorized.exception';
import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { AccountStatus } from '@common/enums';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly accountService: AccountService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req.cookies[COOKIE_NAMES.REFRESH_TOKEN] as string;
        }
      ]),
      secretOrKey: configService.get<string>('JWT_SECRET'),
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
