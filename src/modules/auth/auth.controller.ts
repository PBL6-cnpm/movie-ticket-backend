import { BaseController } from '@bases/base-controller';
import { Public } from '@common/decorators/public.decorator';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import {
  LoginResponse,
  RefreshTokenResponse,
  RegisterResponse,
  ResendEmailVerificationResponse
} from './interfaces/authResponse.interface';
import { AuthGuard } from '@nestjs/passport';
import { CurrentAccount } from '@common/decorators/current-account.decorator';
import { AccountPayload } from '@common/types/account-payload.type';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful'
  })
  async register(@Body() registerDto: RegisterDto): Promise<SuccessResponse<RegisterResponse>> {
    const result = await this.authService.register(registerDto);
    return this.success(result);
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

  @Post('verification-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend a verification email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email resent successfully'
  })
  async resendEmailVerification(
    @Body() resendCodeDto: ResendCodeDto
  ): Promise<SuccessResponse<ResendEmailVerificationResponse>> {
    const result = await this.authService.resendEmailVerification(resendCodeDto);
    return this.success(result);
  }

  @Post('verification-email/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify verification code' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Verification code verified successfully' })
  async verifyEmailVerification(
    @Body() verifyCodeDto: VerifyCodeDto
  ): Promise<SuccessResponse<null>> {
    await this.authService.verifyEmailVerification(verifyCodeDto);
    return this.success(null);
  }

  @Post('refresh-tokens')
  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token refreshed successfully' })
  async refreshToken(
    @Res({ passthrough: true }) res: Response,
    @CurrentAccount() account: AccountPayload
  ): Promise<SuccessResponse<RefreshTokenResponse>> {
    const result = await this.authService.refreshToken(res, account.accountId, account.email);
    return this.success(result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Logout successful' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentAccount() account: AccountPayload
  ): Promise<SuccessResponse<null>> {
    await this.authService.logout(req, res, account.accountId);
    return this.success(null);
  }
}
