import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwtPayload.interface';
import { UserService } from '@modules/users/user.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh'
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const refreshToken = req.cookies?.refreshToken as string;
          return refreshToken;
        }
      ]),
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    // const refreshToken: string = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    const user = await this.userService.getUserById(payload.id);

    return {
      id: user.id,
      email: user.email
    };
  }
}
