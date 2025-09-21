import { BaseController } from '@bases/base-controller';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { AccountResponseDto } from './dto/account-response.dto';
import { CreateAccountDto } from './dto/create-account.dto';

@Controller('account')
@ApiTags('Account')
export class AccountController extends BaseController {
  constructor(private readonly accountService: AccountService) {
    super();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new account' })
  async createAccount(
    @Body() createAccountDto: CreateAccountDto
  ): Promise<SuccessResponse<AccountResponseDto>> {
    const newAccount = await this.accountService.createAccount(createAccountDto);
    const response = new AccountResponseDto(newAccount);
    return this.created(response);
  }
}
