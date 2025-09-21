import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwtPayload.interface';
import { AccountService } from '@modules/accounts/account.service';
import { Request } from 'express';
import { RedisService } from 'shared/modules/redis/redis.service';
import { REDIS_KEYS } from 'shared/modules/redis/redis.constant';
import { Unauthorized } from '@common/exceptions/unauthorized.exception';
import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';

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

    return {
      accountId: account.id,
      email: account.email
    };
  }
}
