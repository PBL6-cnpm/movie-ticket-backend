import { COOKIE_NAMES } from '@common/constants/cookie.constant';
import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { AccountStatus, RoleName } from '@common/enums';
import { BadRequest } from '@common/exceptions/bad-request.exception';
import { NotFound } from '@common/exceptions/not-found.exception';
import { getCookieOptions } from '@common/utils';
import { AccountService } from '@modules/accounts/account.service';
import { AccountResponseDto } from '@modules/accounts/dto/account-response.dto';
import { RoleService } from '@modules/roles/role.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import * as ms from 'ms';
import { ExtractJwt } from 'passport-jwt';
import { MailTemplate } from 'shared/modules/mail/mail-template.interface';
import { MAIL_FROM, MAIL_TEMPLATE } from 'shared/modules/mail/mail.constant';
import { MailService } from 'shared/modules/mail/mail.service';
import { REDIS_KEYS } from 'shared/modules/redis/redis.constant';
import { RedisService } from 'shared/modules/redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendEmailDto } from './dto/resend-email.dto';
import { LoginResponse, RefreshTokenResponse } from './interfaces/authResponse.interface';
import { JwtPayload } from './interfaces/jwtPayload.interface';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtVerificationSecret: string;
  private readonly accessTokenTtl: string;
  private readonly refreshTokenTtl: string;
  private readonly emailVerificationTokenTtl: string;

  constructor(
    private readonly accountService: AccountService,
    private readonly roleService: RoleService,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET');
    this.jwtVerificationSecret = this.configService.get<string>('JWT_VERIFICATION_SECRET');
    this.accessTokenTtl = this.configService.get<string>('ACCESS_TOKEN_TTL');
    this.refreshTokenTtl = this.configService.get<string>('REFRESH_TOKEN_TTL');
    this.emailVerificationTokenTtl = this.configService.get<string>('EMAIL_VERIFICATION_TOKEN_TTL');
  }

  async register(registerDto: RegisterDto): Promise<AccountResponseDto> {
    const existingAccount = await this.accountService.findOne({
      where: { email: registerDto.email }
    });
    if (existingAccount) {
      throw new BadRequest(RESPONSE_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create new account
    const customerId = await this.roleService.getRoleIdByName(RoleName.CUSTOMER);
    const newAccount = await this.accountService.create({
      ...registerDto,
      password: hashedPassword,
      status: AccountStatus.PENDING,
      roleId: customerId
    });

    // Send verification email
    const verificationToken = await this.generateToken(
      newAccount.id,
      newAccount.email,
      this.jwtVerificationSecret,
      this.emailVerificationTokenTtl
    );
    await this.sendVerificationEmail(
      newAccount.email,
      verificationToken,
      MAIL_TEMPLATE.EMAIL_VERIFICATION_REQUEST
    );

    return new AccountResponseDto(newAccount, RoleName.CUSTOMER);
  }

  async requestEmailVerification(resendCodeDto: ResendEmailDto): Promise<void> {
    const account = await this.accountService.findOne({
      where: { email: resendCodeDto.email },
      select: ['id', 'email']
    });
    if (!account) {
      throw new NotFound(RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    // Send verification email
    const verificationToken = await this.generateToken(
      account.id,
      account.email,
      this.jwtVerificationSecret,
      this.emailVerificationTokenTtl
    );
    await this.sendVerificationEmail(
      account.email,
      verificationToken,
      MAIL_TEMPLATE.EMAIL_VERIFICATION_RESEND
    );
  }

  async verifyEmailVerification(token: string): Promise<void> {
    const payload = await this.verifyToken(token, this.jwtVerificationSecret);

    const account = await this.accountService.findOne({
      where: { email: payload.email },
      select: ['id', 'status']
    });
    if (!account) {
      throw new NotFound(RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    // Check account status
    const isAlreadyActive = this.handleAccountStatus(account.status);
    if (!isAlreadyActive) {
      await this.accountService.updateById(account.id, {
        status: AccountStatus.ACTIVE
      });
    }

    return;
  }

  async login(res: Response, loginDto: LoginDto): Promise<LoginResponse> {
    const account = await this.accountService.findOne({
      where: { email: loginDto.email },
      relations: ['role']
    });

    const isValid = account && (await bcrypt.compare(loginDto.password, account.password));

    if (!isValid) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    const isAlreadyActive = this.handleAccountStatus(account.status);
    if (!isAlreadyActive) {
      // Send verification email
      const verificationToken = await this.generateToken(
        account.id,
        account.email,
        this.jwtVerificationSecret,
        this.emailVerificationTokenTtl
      );
      await this.sendVerificationEmail(
        account.email,
        verificationToken,
        MAIL_TEMPLATE.EMAIL_VERIFICATION_RESEND
      );

      return {
        message: RESPONSE_MESSAGES.EMAIL_NOT_VERIFIED.message,
        account: new AccountResponseDto(account)
      };
    }

    const { accessToken } = await this.generateAndStoreTokens(res, account.id, account.email);

    return {
      accessToken,
      account: new AccountResponseDto(account)
    };
  }

  async refreshToken(
    res: Response,
    accountId: string,
    email: string
  ): Promise<RefreshTokenResponse> {
    const { accessToken } = await this.generateAndStoreTokens(res, accountId, email);

    return { accessToken };
  }

  async logout(req: Request, res: Response, accountId: string): Promise<void> {
    const accessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN] as string;

    this.delRefreshTokenFromCookie(res);

    if (accessToken) {
      await this.setBlacklistTokenToRedis(accessToken);
    }
    if (refreshToken) {
      await this.removeRefreshTokenFromUserSession(accountId, refreshToken);
    }
  }

  private async sendVerificationEmail(
    email: string,
    token: string,
    { subject, template }: MailTemplate
  ): Promise<void> {
    const url = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;
    await this.mailService.sendEmail(subject, MAIL_FROM, email, {
      template,
      context: { name: email, url }
    });
  }

  // Generate tokens
  private async generateToken(
    accountId: string,
    email: string,
    secret: string,
    ttl: string
  ): Promise<string> {
    const payload: JwtPayload = {
      accountId,
      email,
      iat: Math.floor(Date.now() / 1000)
    };

    return this.jwtService.signAsync(payload, { secret, expiresIn: ttl });
  }

  private async generateAndStoreTokens(
    res: Response,
    accountId: string,
    email: string
  ): Promise<{ accessToken: string }> {
    const accessToken = await this.generateToken(
      accountId,
      email,
      this.jwtSecret,
      this.accessTokenTtl
    );
    const refreshToken = await this.generateToken(
      accountId,
      email,
      this.jwtSecret,
      this.refreshTokenTtl
    );

    this.setRefreshTokenToCookie(res, refreshToken);
    await this.addRefreshTokenToUserSession(accountId, refreshToken);

    return { accessToken };
  }

  // Verify tokens
  private async verifyToken(token: string, secret: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verifyAsync(token, { secret });
    } catch {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
    }
  }

  // Cookie
  private setRefreshTokenToCookie(res: Response, refreshToken: string) {
    const expiredTime = Number(ms(this.refreshTokenTtl as any));
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const cookieOptions = getCookieOptions(nodeEnv);

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...cookieOptions,
      maxAge: expiredTime
    });
  }

  private delRefreshTokenFromCookie(res: Response) {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const cookieOptions = getCookieOptions(nodeEnv);

    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, cookieOptions);
  }

  // Redis
  private async addRefreshTokenToUserSession(accountId: string, token: string): Promise<void> {
    const ttlSeconds = Number(ms(this.refreshTokenTtl as any)) / 1000;

    await this.redisService.addToRedisSetAndKey(
      REDIS_KEYS.ACTIVE_REFRESH_TOKEN(token),
      accountId,
      REDIS_KEYS.USER_SESSIONS(accountId),
      token,
      ttlSeconds
    );
  }

  private async removeRefreshTokenFromUserSession(accountId: string, token: string): Promise<void> {
    await this.redisService.removeFromRedisSetAndKey(
      REDIS_KEYS.ACTIVE_REFRESH_TOKEN(token),
      REDIS_KEYS.USER_SESSIONS(accountId),
      token
    );
  }

  private async setBlacklistTokenToRedis(token: string): Promise<void> {
    const payload = await this.verifyToken(token, this.jwtSecret);
    const ttl = payload.exp - Math.floor(Date.now() / 1000);

    if (ttl > 0) {
      await this.redisService.set(REDIS_KEYS.BLACKLIST(token), 'true', ttl);
    }
  }

  private handleAccountStatus(status: AccountStatus): boolean {
    switch (status) {
      case AccountStatus.ACTIVE:
        return true;
      case AccountStatus.PENDING:
        return false;
      case AccountStatus.DELETED:
        throw new BadRequest(RESPONSE_MESSAGES.ACCOUNT_DELETED);
      default:
        throw new BadRequest(RESPONSE_MESSAGES.UNKNOWN_ACCOUNT_STATUS);
    }
  }
}
