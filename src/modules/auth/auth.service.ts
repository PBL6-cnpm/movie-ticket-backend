import { COOKIE_NAMES } from '@common/constants/cookie.constant';
import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { AccountStatus, RoleName } from '@common/enums';
import { BadRequest } from '@common/exceptions/bad-request.exception';
import { AccountService } from '@modules/accounts/account.service';
import { RoleService } from '@modules/roles/role.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import * as ms from 'ms';
import { MAIL_FROM, MAIL_TEMPLATE } from 'shared/modules/mail/mail.constant';
import { MailService } from 'shared/modules/mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  LoginResponse,
  RefreshTokenResponse,
  RegisterResponse,
  ResendEmailVerificationResponse
} from './interfaces/authResponse.interface';
import { JwtPayload } from './interfaces/jwtPayload.interface';
import { MailTemplate } from 'shared/modules/mail/mail-template.interface';
import { AccountResponseDto } from '@modules/accounts/dto/account-response.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { NotFound } from '@common/exceptions/not-found.exception';
import { Account } from 'shared/db/entities/account.entity';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { RedisService } from 'shared/modules/redis/redis.service';
import { REDIS_KEYS } from 'shared/modules/redis/redis.constant';
import { getCookieOptions, randomNumericCode } from '@common/utils';
import { ExtractJwt } from 'passport-jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly accountService: AccountService,
    private readonly roleService: RoleService,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    // Check if account exists
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

    const verificationToken = await this.sendVerificationEmail(
      newAccount.id,
      newAccount.email,
      MAIL_TEMPLATE.EMAIL_VERIFICATION_REQUEST
    );

    return {
      verificationToken,
      account: new AccountResponseDto(newAccount, RoleName.CUSTOMER)
    };
  }

  async login(res: Response, loginDto: LoginDto): Promise<LoginResponse> {
    // Check if account exists
    const account = await this.accountService.findOne({
      where: { email: loginDto.email },
      relations: ['role']
    });
    if (!account) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, account.password);

    if (!isPasswordValid) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    const verificationToken = await this.handleAccountStatus(account);
    if (verificationToken) {
      return {
        verificationToken,
        account: new AccountResponseDto(account)
      };
    }

    const accessToken = await this.generateAccessToken(account.id, account.email);

    const refreshToken = await this.generateRefreshToken(account.id, account.email);
    this.setRefreshToken(res, refreshToken);
    const ttl = Number(ms(this.configService.get<string>('REFRESH_TOKEN_TTL') as any)) / 1000;
    await this.redisService.set(REDIS_KEYS.REFRESH_TOKEN(account.id), refreshToken, ttl);

    return {
      accessToken,
      account: new AccountResponseDto(account)
    };
  }

  async resendEmailVerification(
    resendCodeDto: ResendCodeDto
  ): Promise<ResendEmailVerificationResponse> {
    const account = await this.accountService.findOne({
      where: { email: resendCodeDto.email },
      select: ['id', 'email']
    });
    if (!account) {
      throw new NotFound(RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    const verificationToken = await this.sendVerificationEmail(
      account.id,
      account.email,
      MAIL_TEMPLATE.EMAIL_VERIFICATION_RESEND
    );

    return { verificationToken };
  }

  async verifyEmailVerification(verifyCodeDto: VerifyCodeDto): Promise<void> {
    // Validate the token
    const payload: JwtPayload = await this.verifyToken(verifyCodeDto.token);

    // Check if the code matches
    if (!payload.code || payload.code !== verifyCodeDto.code) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_CODE);
    }

    const account = await this.accountService.findOne({
      where: { email: payload.email },
      select: ['id']
    });
    if (!account) {
      throw new NotFound(RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    // Change account status to ACTIVE
    await this.accountService.updateById(account.id, {
      status: AccountStatus.ACTIVE
    });
  }

  async refreshToken(
    res: Response,
    accountId: string,
    email: string
  ): Promise<RefreshTokenResponse> {
    const accessToken = await this.generateAccessToken(accountId, email);

    const refreshToken = await this.generateRefreshToken(accountId, email);
    this.setRefreshToken(res, refreshToken);
    const ttl = Number(ms(this.configService.get<string>('REFRESH_TOKEN_TTL') as any)) / 1000;
    await this.redisService.set(REDIS_KEYS.REFRESH_TOKEN(accountId), refreshToken, ttl);

    return { accessToken };
  }

  async logout(req: Request, res: Response, accountId: string): Promise<void> {
    this.delRefreshTokenInCookie(res);

    const accessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    await this.setBlacklistToken(accessToken);

    await this.redisService.del(REDIS_KEYS.REFRESH_TOKEN(accountId));
  }

  private async generateAccessToken(accountId: string, email: string): Promise<string> {
    const payload: JwtPayload = {
      accountId,
      email,
      iat: Math.floor(Date.now() / 1000)
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_TTL')
    });
  }

  private async generateRefreshToken(accountId: string, email: string): Promise<string> {
    const payload: JwtPayload = {
      accountId,
      email,
      iat: Math.floor(Date.now() / 1000)
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_TTL')
    });
  }

  private async generateEmailVerificationToken(
    accountId: string,
    email: string,
    code: string
  ): Promise<string> {
    const payload: JwtPayload = {
      accountId,
      email,
      code,
      iat: Math.floor(Date.now() / 1000)
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('EMAIL_VERIFICATION_TOKEN_TTL')
    });
  }

  private async sendVerificationEmail(
    accountId: string,
    email: string,
    { subject, template }: MailTemplate
  ): Promise<string> {
    // Generate OTP code
    const code = randomNumericCode();

    // Send verification email
    await this.mailService.sendEmail(subject, MAIL_FROM, email, {
      template,
      context: { name: email, code }
    });

    return this.generateEmailVerificationToken(accountId, email, code);
  }

  private setRefreshToken(res: Response, refreshToken: string) {
    const expiredTime = Number(ms(this.configService.get<string>('REFRESH_TOKEN_TTL') as any));
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const cookieOptions = getCookieOptions(nodeEnv);

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...cookieOptions,
      maxAge: expiredTime
    });
  }

  private delRefreshTokenInCookie(res: Response) {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const cookieOptions = getCookieOptions(nodeEnv);

    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, cookieOptions);
  }

  private async setBlacklistToken(token: string): Promise<void> {
    const payload = await this.verifyToken(token);
    const ttl = payload.exp - Math.floor(Date.now() / 1000);
    await this.redisService.set(REDIS_KEYS.BLACKLIST(token), 'true', ttl);
  }

  async handleAccountStatus(account: Account): Promise<string | null> {
    if (account.status === AccountStatus.PENDING) {
      return this.sendVerificationEmail(
        account.id,
        account.email,
        MAIL_TEMPLATE.EMAIL_VERIFICATION_RESEND
      );
    }

    if (account.status === AccountStatus.DELETED) {
      throw new BadRequest(RESPONSE_MESSAGES.ACCOUNT_DELETED);
    }

    return null;
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      return this.jwtService.verifyAsync(token, { secret });
    } catch {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
    }
  }
}
