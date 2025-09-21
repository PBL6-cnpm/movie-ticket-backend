import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { Unauthorized } from '@common/exceptions/unauthorized.exception';
import { AccountService } from '@modules/accounts/account.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { REDIS_KEYS } from 'shared/modules/redis/redis.constant';
import { RedisService } from 'shared/modules/redis/redis.service';
import { JwtPayload } from '../interfaces/jwtPayload.interface';
import { AccountStatus } from '@common/enums';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly accountService: AccountService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
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

    return {
      accountId: account.id,
      email: account.email
    };
  }
}
