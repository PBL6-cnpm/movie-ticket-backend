import { BaseController } from '@bases/base-controller';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { IPaginatedResponse } from '@common/types/pagination-base.type';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { AccountResponseDto } from './dto/account-response.dto';
import { AdminAccountDto } from './dto/admin-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { SearchAccountDto } from './dto/search-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('accounts')
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

  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new admin account'
  })
  async createAdminAccount(
    @Body() createAdminAccountDto: CreateAdminAccountDto
  ): Promise<SuccessResponse<AccountResponseDto>> {
    const newAdminAccount = await this.accountService.createAdminAccount(createAdminAccountDto);
    const response = new AccountResponseDto(newAdminAccount);
    return this.created(response);
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search accounts'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Accounts searched successfully with pagination',
    type: IPaginatedResponse<AccountResponseDto>
  })
  async searchAccounts(
    @Query() searchDto: SearchAccountDto
  ): Promise<SuccessResponse<IPaginatedResponse<AccountResponseDto>>> {
    const paginatedResult = await this.accountService.searchAccounts(searchDto);

    const response: IPaginatedResponse<AccountResponseDto> = {
      items: paginatedResult.items.map((account) => new AccountResponseDto(account)),
      meta: paginatedResult.meta
    };

    return this.success(response);
  }

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all admin accounts',
    description: 'Retrieve all accounts that have ADMIN role with pagination'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of admin accounts retrieved successfully with pagination',
    type: IPaginatedResponse<AccountResponseDto>
  })
  async getAllAdminAccounts(
    @Query() adminAccountDto: AdminAccountDto
  ): Promise<SuccessResponse<IPaginatedResponse<AccountResponseDto>>> {
    const paginatedResult = await this.accountService.getAllAdminAccounts(adminAccountDto);

    const response: IPaginatedResponse<AccountResponseDto> = {
      items: paginatedResult.items.map((account) => new AccountResponseDto(account)),
      meta: paginatedResult.meta
    };

    return this.success(response);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update account',
    description: 'Update an existing account with new information including roles'
  })
  async updateAccount(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto
  ): Promise<SuccessResponse<AccountResponseDto>> {
    const updatedAccount = await this.accountService.updateAccount(id, updateAccountDto);
    const response = new AccountResponseDto(updatedAccount);
    return this.success(response);
  }
}
