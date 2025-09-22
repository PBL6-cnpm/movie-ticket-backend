import { BaseController } from '@bases/base-controller';
import { CurrentAccount } from '@common/decorators/current-account.decorator';
import { Public } from '@common/decorators/public.decorator';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { AccountPayload } from '@common/types/account-payload.type';
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
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendEmailDto } from './dto/resend-email.dto';
import { LoginResponse, RefreshTokenResponse } from './interfaces/authResponse.interface';

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

  @Post('verification-emails')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend a verification email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email resent successfully'
  })
  async requestEmailVerification(
    @Body() resendCodeDto: ResendEmailDto
  ): Promise<SuccessResponse<null>> {
    await this.authService.requestEmailVerification(resendCodeDto);
    return this.success(null);
  }

  @Get('verification-emails/verify/:token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify verification email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Verification email verified successfully' })
  async verifyEmailVerification(@Param('token') token: string): Promise<SuccessResponse<null>> {
    await this.authService.verifyEmailVerification(token);
    return this.success(null);
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
