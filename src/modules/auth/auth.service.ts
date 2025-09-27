import { COOKIE_NAMES } from '@common/constants/cookie.constant';
import { MAIL_FROM, MAIL_TEMPLATE } from '@common/constants/email.constant';
import { QUEUE_KEY } from '@common/constants/queue.constant';
import { REDIS_KEYS } from '@common/constants/redis.constant';
import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { AccountStatus, RoleName } from '@common/enums';
import { BadRequest } from '@common/exceptions/bad-request.exception';
import { NotFound } from '@common/exceptions/not-found.exception';
import { MailTemplate } from '@common/interfaces/mail-template.interface';
import { getCookieOptions } from '@common/utils';
import { parseTtlToSeconds } from '@common/utils/string.helper';
import { config, jwt } from '@config/index';
import { AccountService } from '@modules/accounts/account.service';
import { AccountResponseDto } from '@modules/accounts/dto/account-response.dto';
import { RoleService } from '@modules/roles/role.service';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Queue } from 'bull';
import { Request, Response } from 'express';
import { ExtractJwt } from 'passport-jwt';
import { MailService } from 'shared/modules/mail/mail.service';
import { RedisService } from 'shared/modules/redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendEmailDto } from './dto/resend-email.dto';
import { LoginResponse, RefreshTokenResponse } from './interfaces/authResponse.interface';
import { JwtPayload } from './interfaces/jwtPayload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly accountService: AccountService,
    private readonly roleService: RoleService,

    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,

    @InjectQueue(QUEUE_KEY.sendEmail)
    private readonly emailQueue: Queue
  ) {}

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
    const customerRoleId = await this.roleService.getRoleIdByName(RoleName.CUSTOMER);
    const newAccount = await this.accountService.create({
      ...registerDto,
      password: hashedPassword,
      status: AccountStatus.PENDING,
      roleId: customerRoleId
    });

    // Send verification email
    await this.generateAndSendEmailVerification(
      newAccount.id,
      newAccount.email,
      MAIL_TEMPLATE.EMAIL_VERIFICATION_REQUEST,
      newAccount.fullName
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
    await this.generateAndSendEmailVerification(
      account.id,
      account.email,
      MAIL_TEMPLATE.EMAIL_VERIFICATION_RESEND,
      account.fullName
    );
  }

  async verifyEmailVerification(res: Response, token: string): Promise<void> {
    try {
      const payload = await this.verifyToken(token, jwt.jwtVerificationSecret);

      // Check token in redis
      const storedToken = await this.redisService.get(
        REDIS_KEYS.EMAIL_VERIFICATION(payload.accountId)
      );
      if (!storedToken || storedToken !== token) {
        throw new BadRequest(RESPONSE_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
      }
      await this.redisService.del(REDIS_KEYS.EMAIL_VERIFICATION(payload.accountId));

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

      return res.redirect(`${jwt.clientVerifySuccessUrl}?email=${payload.email}`);
    } catch {
      return res.redirect(jwt.clientVerifyFailedUrl);
    }
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
      await this.generateAndSendEmailVerification(
        account.id,
        account.email,
        MAIL_TEMPLATE.EMAIL_VERIFICATION_RESEND,
        account.fullName
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

  // Tokens
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
    const accessToken = await this.generateToken(accountId, email, jwt.secret, jwt.accessTokenTtl);
    const refreshToken = await this.generateToken(
      accountId,
      email,
      jwt.secret,
      jwt.refreshTokenTtl
    );

    this.setRefreshTokenToCookie(res, refreshToken);
    await this.addRefreshTokenToUserSession(accountId, refreshToken);

    return { accessToken };
  }

  private async verifyToken(token: string, secret: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verifyAsync(token, { secret });
    } catch {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
    }
  }

  // Cookie
  private setRefreshTokenToCookie(res: Response, refreshToken: string) {
    const expiredTime = parseInt(jwt.refreshTokenTtl) * 1000;
    const nodeEnv = config.nodeEnv;
    const cookieOptions = getCookieOptions(nodeEnv);

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...cookieOptions,
      maxAge: expiredTime
    });
  }

  private delRefreshTokenFromCookie(res: Response) {
    const nodeEnv = config.nodeEnv;
    const cookieOptions = getCookieOptions(nodeEnv);

    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, cookieOptions);
  }

  // Redis
  private async addRefreshTokenToUserSession(accountId: string, token: string): Promise<void> {
    const ttlSeconds = parseTtlToSeconds(jwt.refreshTokenTtl);

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
    const payload = await this.verifyToken(token, jwt.secret);
    const ttl = payload.exp - Math.floor(Date.now() / 1000);

    if (ttl > 0) {
      await this.redisService.set(REDIS_KEYS.BLACKLIST(token), 'true', ttl);
    }
  }

  private async setEmailVerificationTokenToRedis(accountId: string, token: string): Promise<void> {
    const ttlSeconds = parseTtlToSeconds(jwt.emailVerificationTokenTtl);
    await this.redisService.set(REDIS_KEYS.EMAIL_VERIFICATION(accountId), token, ttlSeconds);
  }

  // Others
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

  private async sendVerificationEmail(
    email: string,
    token: string,
    { subject, template }: MailTemplate
  ): Promise<void> {
    const url = `${jwt.apiEmailVerifyUrl}${token}`;
    await this.mailService.sendEmail({
      toAddress: email,
      fromAddress: MAIL_FROM,
      subject,
      template,
      options: {
        context: { name: email, url }
      }
    });
  }

  private async generateAndSendEmailVerification(
    accountId: string,
    email: string,
    mailTemplate: MailTemplate,
    fullName?: string
  ): Promise<void> {
    const verificationToken = await this.generateToken(
      accountId,
      email,
      jwt.jwtVerificationSecret,
      jwt.emailVerificationTokenTtl
    );

    await this.emailQueue.add({
      data: {
        toAddress: email,
        verificationToken,
        template: mailTemplate.template,
        subject: mailTemplate.subject,
        options: {
          context: { name: fullName, url: `${jwt.apiEmailVerifyUrl}${verificationToken}` }
        }
      }
    });

    await this.setEmailVerificationTokenToRedis(accountId, verificationToken);
  }
}
