import { BaseController } from '@bases/base-controller';
import { Public } from '@common/decorators/public.decorator';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponse } from './interfaces/authResponse.interface';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
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
}
