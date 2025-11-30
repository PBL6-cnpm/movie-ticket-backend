import {
  COOKIE_NAMES,
  MAIL_TEMPLATE,
  QUEUE_KEY,
  REDIS_KEYS,
  RESPONSE_MESSAGES
} from '@common/constants';
import { AccountStatus, RoleName } from '@common/enums';
import { BadRequest, NotFound } from '@common/exceptions';
import { MailTemplate } from '@common/interfaces/mail-template.interface';
import { ContextUser } from '@common/types/user.type';
import { generatePassword, getCookieOptions, parseTtlToSeconds } from '@common/utils';
import { APP, GOOGLE, JWT, URL } from '@configs/env.config';
import { AccountService } from '@modules/accounts/account.service';
import { AccountResponseDto } from '@modules/accounts/dto/account-response.dto';
import { RoleService } from '@modules/roles/role.service';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountRole } from '@shared/db/entities/account-role.entity';
import { Account } from '@shared/db/entities/account.entity';
import { RedisService } from '@shared/modules/redis/redis.service';
import * as bcrypt from 'bcryptjs';
import { Queue } from 'bull';
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { ExtractJwt } from 'passport-jwt';
import { GoogleProfileDto } from './dto/google-profile.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { AuthTokens, LoginResponse } from './interfaces/authResponse.interface';
import { JwtPayload } from './interfaces/jwt.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly accountService: AccountService,
    private readonly roleService: RoleService,

    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    @InjectQueue(QUEUE_KEY.sendEmail)
    private readonly emailQueue: Queue,
    private googleClient: OAuth2Client
  ) {}

  async register(registerDto: RegisterDto): Promise<AccountResponseDto> {
    const existingAccount = await this.accountService.findOne({
      where: { email: registerDto.email }
    });
    if (existingAccount) {
      throw new BadRequest(RESPONSE_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Create new account
    const [customerRole, hashedPassword] = await Promise.all([
      this.roleService.getRoleByName(RoleName.CUSTOMER),
      bcrypt.hash(registerDto.password, 10)
    ]);

    const newAccount = await this.accountService.create({
      ...registerDto,
      password: hashedPassword,
      status: AccountStatus.PENDING,
      accountRoles: [{ role: customerRole }]
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

      const isAlreadyActive = this.isActiveAccount(account.status);
      if (!isAlreadyActive) {
        await this.accountService.updateById(account.id, {
          status: AccountStatus.ACTIVE
        });
      }

      return res.redirect(URL.clientVerifySuccessUrl);
    } catch {
      return res.redirect(URL.clientVerifyFailureUrl);
    }
  }

  async login(res: Response, loginDto: LoginDto): Promise<LoginResponse> {
    const account = await this.accountService.findOne({
      where: { email: loginDto.email },
      relations: ['accountRoles', 'accountRoles.role', 'branch']
    });

    const isValid = account && (await bcrypt.compare(loginDto.password, account.password));

    if (!isValid) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    const isAlreadyActive = this.isActiveAccount(account.status);
    if (!isAlreadyActive) {
      // Send verification email
      await this.generateAndSendEmailVerification(account, MAIL_TEMPLATE.EMAIL_VERIFICATION_RESEND);

      return {
        message: RESPONSE_MESSAGES.EMAIL_NOT_VERIFIED.message,
        account: new AccountResponseDto(account)
      };
    }

    const authTokens = await this.generateAndStoreAuthTokens(res, account);

    await this.setContextUserToCache(this.convertAccountToContextUser(account));

    return {
      ...authTokens,
      account: new AccountResponseDto(account)
    };
  }

  async refreshToken(req: Request, res: Response, account: ContextUser): Promise<AuthTokens> {
    // Invalidate refresh token
    const refreshToken = req.refreshToken;
    await this.redisService.removeKeyFromSet(REDIS_KEYS.USER_SESSIONS(account.id), refreshToken);

    // Generate new tokens
    const authTokens = await this.generateAndStoreAuthTokens(res, account as Account);
    return authTokens;
  }

  async logout(req: Request, res: Response, accountId: string): Promise<void> {
    const accessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const refreshToken = req.refreshToken;

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

    // Send new password email
    const newPassword = generatePassword();

    const mailTemplate = MAIL_TEMPLATE.RESET_PASSWORD_REQUEST;
    await this.emailQueue.add({
      data: {
        toAddress: account.email,
        template: mailTemplate.template,
        subject: mailTemplate.subject,
        options: {
          context: {
            name: account.fullName,
            newPassword
          }
        }
      }
    });

    // Update new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await this.accountService.updateById(account.id, { password: newHashedPassword });
  }

  // Tokens
  private async generateToken(
    secret: string,
    ttl: string,
    accountId: string,
    email: string,
    avatarUrl?: string,
    roles?: AccountRole[],
    branchId?: string
  ): Promise<string> {
    const payload: JwtPayload = {
      accountId,
      email,
      ...(roles && roles.length > 0 && { roles }),
      ...(avatarUrl && { avatarUrl }),
      ...(branchId && { branchId }),
      iat: Math.floor(Date.now() / 1000)
    };

    return this.jwtService.signAsync(payload, { secret, expiresIn: parseTtlToSeconds(ttl) });
  }

  private async generateAndStoreAuthTokens(res: Response, account: Account): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateToken(
        JWT.secret,
        JWT.accessTokenTtl,
        account.id,
        account.email,
        account.avatarUrl,
        account.accountRoles,
        account.branchId
      ),
      this.generateToken(
        JWT.secret,
        JWT.refreshTokenTtl,
        account.id,
        account.email,
        account.avatarUrl,
        account.accountRoles,
        account.branchId
      )
    ]);

    this.setRefreshTokenToCookie(res, refreshToken);

    // Store refresh token in redis
    await this.redisService.addToSet(REDIS_KEYS.USER_SESSIONS(account.id), refreshToken);

    return { accessToken, refreshToken };
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

  private async setContextUserToCache(user: ContextUser) {
    const ttlSeconds = parseTtlToSeconds(JWT.refreshTokenTtl);
    await this.redisService.set(REDIS_KEYS.ACCOUNT_CONTEXT(user.id), user, ttlSeconds);
  }

  private convertAccountToContextUser(account: Account): ContextUser {
    return new ContextUser(account);
  }

  // Others
  private isActiveAccount(status: AccountStatus): boolean {
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
        template: mailTemplate.template,
        subject: mailTemplate.subject,
        options: {
          context: { name: account.fullName, url: `${URL.apiEmailVerifyUrl}${verificationToken}` }
        }
      }
    });

    await this.setEmailVerificationTokenToRedis(account.id, verificationToken);
  }

  async socialLogin(res: Response, socialLoginDto: SocialLoginDto): Promise<LoginResponse> {
    const googleProfile = await this.verifyGoogleToken(socialLoginDto.token);
    if (!googleProfile) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_GOOGLE_TOKEN);
    }

    const account = await this.findOrCreateAccount(googleProfile);

    const authTokens = await this.generateAndStoreAuthTokens(res, account);

    await this.setContextUserToCache(this.convertAccountToContextUser(account));

    return {
      ...authTokens,
      account: new AccountResponseDto(account)
    };
  }

  private async verifyGoogleToken(idToken: string): Promise<GoogleProfileDto> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE.clientID
    });
    const payload = ticket.getPayload();

    if (!payload) {
      return null;
    }

    return new GoogleProfileDto(payload);
  }

  async findOrCreateAccount(profile: GoogleProfileDto): Promise<Account> {
    const account = await this.accountService.findOne({
      where: { email: profile.email },
      relations: ['accountRoles', 'accountRoles.role', 'branch']
    });

    if (account) {
      const isVerified = this.isActiveAccount(account.status);

      if (!isVerified) {
        await this.accountService.updateById(account.id, { status: AccountStatus.ACTIVE });
        return account;
      }

      return account;
    }

    // Create a new account if it doesn't exist
    const [customerRole, hashedPassword] = await Promise.all([
      this.roleService.getRoleByName(RoleName.CUSTOMER),
      bcrypt.hash(generatePassword(), 10)
    ]);

    const newAccount = await this.accountService.create({
      ...profile,
      password: hashedPassword,
      status: AccountStatus.ACTIVE,
      accountRoles: [{ role: customerRole }]
    });

    return newAccount;
  }
}
