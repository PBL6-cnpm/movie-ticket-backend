import { BaseController } from '@bases/base-controller';
import { CurrentAccount } from '@common/decorators/current-account.decorator';
import { Public } from '@common/decorators/public.decorator';
import { EmailThrottlerGuard } from '@common/guards/email-throttle.guard';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { ContextUser } from '@common/types/user.type';
import { AccountResponseDto } from '@modules/accounts/dto/account-response.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { AuthTokens, LoginResponse } from './interfaces/authResponse.interface';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a new account' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registration successful'
  })
  async register(@Body() registerDto: RegisterDto): Promise<SuccessResponse<AccountResponseDto>> {
    const result = await this.authService.register(registerDto);
    return this.success(result);
  }

  @Post('email-verifications')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend a verification email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email resent successfully'
  })
  async requestEmailVerification(
    @Body() sendEmailDto: SendEmailDto
  ): Promise<SuccessResponse<null>> {
    await this.authService.requestEmailVerification(sendEmailDto);
    return this.success(null);
  }

  @Get('email-verifications/:token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify verification email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Verification email verified successfully' })
  async verifyEmailVerification(@Param('token') token: string, @Res() res: Response) {
    await this.authService.verifyEmailVerification(res, token);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful'
  })
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() loginDto: LoginDto
  ): Promise<SuccessResponse<LoginResponse>> {
    const result = await this.authService.login(res, loginDto);
    return this.success(result);
  }

  @Post('google/login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register with Google' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login or registration with Google successful'
  })
  async socialLogin(
    @Res({ passthrough: true }) res: Response,
    @Body() socialLoginDto: SocialLoginDto
  ): Promise<SuccessResponse<LoginResponse>> {
    const result = await this.authService.socialLogin(res, socialLoginDto);
    return this.success(result);
  }

  @Post('refresh-tokens')
  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token refreshed successfully' })
  async refreshToken(
    @Res({ passthrough: true }) res: Response,
    @CurrentAccount() account: ContextUser
  ): Promise<SuccessResponse<AuthTokens>> {
    const result = await this.authService.refreshToken(res, account);
    return this.success(result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Logout successful' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentAccount() account: ContextUser
  ): Promise<SuccessResponse<null>> {
    await this.authService.logout(req, res, account.id);
    return this.success(null);
  }

  @Post('forgot-password')
  @Public()
  @UseGuards(EmailThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset email sent successfully' })
  async requestPasswordReset(@Body() sendEmailDto: SendEmailDto): Promise<SuccessResponse<null>> {
    await this.authService.requestPasswordReset(sendEmailDto);
    return this.success(null);
  }
}
