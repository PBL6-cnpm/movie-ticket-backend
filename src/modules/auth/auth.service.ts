import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserService } from '@modules/users/user.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponse } from './interfaces/authResponse.interface';
import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { BadRequest } from '@common/exceptions/bad-request.exception';
import { JwtPayload } from './interfaces/jwtPayload.interface';
import { Response } from 'express';
import { COOKIE_NAMES } from '@common/constants/cookie.constant';
import * as ms from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,

    private readonly eventEmitter: EventEmitter2
  ) {}

  async login(res: Response, loginDto: LoginDto): Promise<LoginResponse> {
    // Check if user exists
    const user = await this.userService.findOne({
      where: { email: loginDto.email }
    });
    if (!user) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    const accessToken = await this.generateAccessToken(user.id, user.email);

    const refreshToken = await this.generateRefreshToken(user.id, user.email);
    this.setRefreshToken(res, refreshToken);

    return { accessToken };
  }

  private async generateAccessToken(
    userId: string,
    email: string
  ): Promise<string> {
    const payload: JwtPayload = {
      id: userId,
      email,
      iat: Math.floor(Date.now() / 1000)
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRATION')
    });
  }

  private async generateRefreshToken(
    userId: string,
    email: string
  ): Promise<string> {
    const payload: JwtPayload = {
      id: userId,
      email,
      iat: Math.floor(Date.now() / 1000)
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION')
    });
  }

  private setRefreshToken(res: Response, refreshToken: string) {
    const expiredTime = Number(
      ms(this.configService.get<string>('REFRESH_TOKEN_EXPIRATION') as any)
    );
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      maxAge: expiredTime,
      sameSite: 'lax',
      path: '/'
    });
  }
}
