import { AccountStatus, RoleName } from '@common/enums';
import { MailTemplate } from '@common/interfaces/mail-template.interface';
import { ContextUser } from '@common/types/user.type';
import { getCookieOptions, parseTtlToSeconds } from '@common/utils';
import { APP, JWT, URL } from '@configs/env.config';
import { AccountService } from '@modules/accounts/account.service';
import { AccountResponseDto } from '@modules/accounts/dto/account-response.dto';
import { RoleService } from '@modules/roles/role.service';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Queue } from 'bull';
import { Request, Response } from 'express';
import { ExtractJwt } from 'passport-jwt';
import { AccountRole } from 'shared/db/entities/account-role.entity';
import { Account } from 'shared/db/entities/account.entity';
import { RedisService } from 'shared/modules/redis/redis.service';
import { Not, Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { LoginResponse, RefreshTokenResponse } from './interfaces/authResponse.interface';
import { JwtPayload } from './interfaces/jwt.interface';
import {
  COOKIE_NAMES,
  MAIL_TEMPLATE,
  QUEUE_KEY,
  REDIS_KEYS,
  RESPONSE_MESSAGES
} from '@common/constants';
import { BadRequest, NotFound } from '@common/exceptions';

@Injectable()
export class AuthService {
  constructor(
    private readonly accountService: AccountService,
    private readonly roleService: RoleService,

    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    @InjectRepository(AccountRole)
    private readonly accountRoleRepository: Repository<AccountRole>, // Sử dụng repository của entity AccountRole
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
    const customerRole = await this.roleService.getRoleByName(RoleName.CUSTOMER);

    const newAccount = await this.accountService.create({
      ...registerDto,
      password: hashedPassword,
      status: AccountStatus.PENDING
    });

    await this.accountRoleRepository.save({
      accountId: newAccount.id,
      roleId: customerRole.id
    });

    // Send verification email
    await this.generateAndSendEmailVerification(
      newAccount,
      MAIL_TEMPLATE.EMAIL_VERIFICATION_REQUEST
    );

    return new AccountResponseDto(newAccount, [customerRole.name]);
  }

  async requestEmailVerification(sendEmailDto: SendEmailDto): Promise<void> {
    const account = await this.accountService.findOne({
      where: { email: sendEmailDto.email },
      select: ['id', 'email', 'fullName']
    });
    if (!account) {
      throw new NotFound(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    // Send verification email
    await this.generateAndSendEmailVerification(account, MAIL_TEMPLATE.EMAIL_VERIFICATION_RESEND);
  }

  async verifyEmailVerification(res: Response, token: string): Promise<void> {
    try {
      const payload = await this.verifyToken(token, JWT.jwtVerificationSecret);

      // Check token in redis
      const storedToken = await this.redisService.get(
        REDIS_KEYS.EMAIL_VERIFICATION(payload.accountId)
      );
      if (!storedToken || storedToken !== token) {
        throw new BadRequest(RESPONSE_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
      }
      await this.redisService.del(REDIS_KEYS.EMAIL_VERIFICATION(payload.accountId));

      // Check account existence
      const account = await this.accountService.findOne({
        where: { email: payload.email },
        select: ['id', 'status']
      });
      if (!account) {
        throw new NotFound(RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND);
      }

      const isAlreadyActive = this.handleAccountStatus(account.status);
      if (!isAlreadyActive) {
        await this.accountService.updateById(account.id, {
          status: AccountStatus.ACTIVE
        });
      }

      return res.redirect(URL.clientVerifySuccessUrl);
    } catch {
      return res.redirect(URL.clientVerifyFailedUrl);
    }
  }

  async login(res: Response, loginDto: LoginDto): Promise<LoginResponse> {
    const account = await this.accountService.findOne({
      where: { email: loginDto.email },
      relations: ['accountRoles', 'accountRoles.role']
    });

    const isValid = account && (await bcrypt.compare(loginDto.password, account.password));

    if (!isValid) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    const isAlreadyActive = this.handleAccountStatus(account.status);
    if (!isAlreadyActive) {
      // Send verification email
      await this.generateAndSendEmailVerification(account, MAIL_TEMPLATE.EMAIL_VERIFICATION_RESEND);

      return {
        message: RESPONSE_MESSAGES.EMAIL_NOT_VERIFIED.message,
        account: new AccountResponseDto(account)
      };
    }

    const { accessToken } = await this.generateAndStoreAuthTokens(res, account);

    await this.setContextUserToCache(account as unknown as ContextUser);

    return {
      accessToken,
      account: new AccountResponseDto(account)
    };
  }

  async refreshToken(res: Response, account: ContextUser): Promise<RefreshTokenResponse> {
    const { accessToken } = await this.generateAndStoreAuthTokens(res, account as Account);

    return { accessToken };
  }

  async logout(req: Request, res: Response, accountId: string): Promise<void> {
    const accessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN] as string;

    this.delRefreshTokenFromCookie(res);

    await this.invalidateTokensInRedis(accountId, accessToken, refreshToken);
  }

  async requestPasswordReset(sendEmailDto: SendEmailDto): Promise<void> {
    const account = await this.accountService.findOne({
      where: { email: sendEmailDto.email },
      select: ['id', 'email', 'fullName', 'status']
    });

    if (!account) {
      throw new NotFound(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    // Send reset password email
    const isVerified = account.status !== AccountStatus.PENDING;
    await this.generateAndSendPasswordResetEmail(
      account.id,
      account.email,
      account.fullName,
      isVerified
    );
  }

  async resetPassword(resetPassword: ResetPasswordDto): Promise<void> {
    const payload = await this.verifyToken(resetPassword.token, JWT.jwtVerificationSecret);

    // Check token in redis
    const storedToken = await this.redisService.get(REDIS_KEYS.RESET_PASSWORD(payload.accountId));
    if (!storedToken || storedToken !== resetPassword.token) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
    }
    await this.redisService.del(REDIS_KEYS.RESET_PASSWORD(payload.accountId));

    // Check account existence
    const account = await this.accountService.findOne({
      where: {
        email: payload.email,
        status: Not(AccountStatus.DELETED)
      },
      select: ['id', 'status']
    });
    if (!account) {
      throw new NotFound(RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(resetPassword.password, 10);
    await this.accountService.updateById(account.id, {
      password: hashedPassword,
      status: AccountStatus.ACTIVE
    });

    // Delete all existing user sessions
    await this.redisService.del(REDIS_KEYS.USER_SESSIONS(account.id));
  }

  async getProfile(accountId: string): Promise<AccountResponseDto> {
    const account = await this.accountService.getAccountById(accountId);

    if (!account) {
      throw new NotFound(RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    return new AccountResponseDto(account);
  }

  // Tokens
  private async generateToken(
    secret: string,
    ttl: string,
    accountId: string,
    email: string,
    avatarUrl?: string,
    roles?: AccountRole[]
  ): Promise<string> {
    const payload: JwtPayload = {
      accountId,
      email,
      ...(roles && roles.length > 0 && { roles }),
      ...(avatarUrl && { avatarUrl }),
      iat: Math.floor(Date.now() / 1000)
    };

    return this.jwtService.signAsync(payload, { secret, expiresIn: ttl });
  }

  private async generateAndStoreAuthTokens(
    res: Response,
    account: Account
  ): Promise<{ accessToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateToken(
        JWT.secret,
        JWT.accessTokenTtl,
        account.id,
        account.email,
        account.avatarUrl,
        account.accountRoles
      ),
      this.generateToken(
        JWT.secret,
        JWT.refreshTokenTtl,
        account.id,
        account.email,
        account.avatarUrl,
        account.accountRoles
      )
    ]);

    this.setRefreshTokenToCookie(res, refreshToken);

    // Store refresh token in redis
    await this.redisService.addToSet(REDIS_KEYS.USER_SESSIONS(account.id), refreshToken);

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
    const expiredTime = parseTtlToSeconds(JWT.refreshTokenTtl) * 1000; // in ms
    const nodeEnv = APP.nodeEnv;
    const cookieOptions = getCookieOptions(nodeEnv);

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...cookieOptions,
      maxAge: expiredTime
    });
  }

  private delRefreshTokenFromCookie(res: Response) {
    const nodeEnv = APP.nodeEnv;
    const cookieOptions = getCookieOptions(nodeEnv);

    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, cookieOptions);
  }

  // Redis
  private async invalidateTokensInRedis(
    accountId: string,
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    // Store access token to blacklist
    if (accessToken) {
      const payload = await this.verifyToken(accessToken, JWT.secret);
      const ttl = payload.exp - Math.floor(Date.now() / 1000);

      if (ttl > 0) {
        await this.redisService.set(REDIS_KEYS.BLACKLIST(accessToken), 'true', ttl);
      }
    }

    // Remove refresh token from user sessions
    if (refreshToken) {
      await this.redisService.removeKeyFromSet(REDIS_KEYS.USER_SESSIONS(accountId), refreshToken);
    }
  }

  private async setEmailVerificationTokenToRedis(accountId: string, token: string): Promise<void> {
    const ttlSeconds = parseTtlToSeconds(JWT.emailVerificationTokenTtl);
    await this.redisService.set(REDIS_KEYS.EMAIL_VERIFICATION(accountId), token, ttlSeconds);
  }

  private async setPasswordResetTokenToRedis(accountId: string, token: string): Promise<void> {
    const ttlSeconds = parseTtlToSeconds(JWT.passwordResetTokenTtl);
    await this.redisService.set(REDIS_KEYS.RESET_PASSWORD(accountId), token, ttlSeconds);
  }

  private async setContextUserToCache(user: ContextUser) {
    const ttlSeconds = parseTtlToSeconds(JWT.refreshTokenTtl);
    await this.redisService.set(REDIS_KEYS.ACCOUNT_CONTEXT(user.id), user, ttlSeconds);
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

  private async generateAndSendEmailVerification(
    account: Account,
    mailTemplate: MailTemplate
  ): Promise<void> {
    const verificationToken = await this.generateToken(
      JWT.jwtVerificationSecret,
      JWT.emailVerificationTokenTtl,
      account.id,
      account.email,
      account.avatarUrl,
      account.accountRoles
    );

    await this.emailQueue.add({
      data: {
        toAddress: account.email,
        verificationToken,
        template: mailTemplate.template,
        subject: mailTemplate.subject,
        options: {
          context: { name: account.fullName, url: `${URL.apiEmailVerifyUrl}${verificationToken}` }
        }
      }
    });

    await this.setEmailVerificationTokenToRedis(account.id, verificationToken);
  }

  private async generateAndSendPasswordResetEmail(
    accountId: string,
    email: string,
    fullName: string,
    isVerified: boolean
  ): Promise<void> {
    const verificationToken = await this.generateToken(
      JWT.jwtVerificationSecret,
      JWT.passwordResetTokenTtl,
      accountId,
      email
    );

    const mailTemplate = MAIL_TEMPLATE.RESET_PASSWORD_REQUEST;
    await this.emailQueue.add({
      data: {
        toAddress: email,
        verificationToken,
        template: mailTemplate.template,
        subject: mailTemplate.subject,
        options: {
          context: {
            name: fullName,
            url: `${URL.clientResetPasswordUrl}?token=${verificationToken}`,
            isVerified
          }
        }
      }
    });

    await this.setPasswordResetTokenToRedis(accountId, verificationToken);
  }
}
