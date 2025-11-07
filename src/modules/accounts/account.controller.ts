import { BaseController } from '@bases/base-controller';
import { CurrentAccount } from '@common/decorators/current-account.decorator';
import { RoleName } from '@common/enums';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { IPaginatedResponse } from '@common/types/pagination-base.type';
import { ContextUser } from '@common/types/user.type';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { AccountResponseDto } from './dto/account-response.dto';
import { AdminAccountDto } from './dto/admin-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateStaffAccountDto } from './dto/create-staff-account.dto';
import { SearchAccountDto } from './dto/search-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ResetPasswordDto, UpdateCustomerAccountDto } from './dto/update-customer-account.dto';
import { UpdateStaffAccountDto } from './dto/update-staff-account.dto';

@Controller('accounts')
@ApiTags('Accounts')
@ApiBearerAuth()
export class AccountController extends BaseController {
  constructor(private readonly accountService: AccountService) {
    super();
  }

  // Customers
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user profile retrieved successfully'
  })
  async getProfile(
    @CurrentAccount() account: ContextUser
  ): Promise<SuccessResponse<AccountResponseDto>> {
    const acc = await this.accountService.getProfile(account.id);
    const result = new AccountResponseDto(acc);
    return this.success(result);
  }

  @Put('me')
  @UseInterceptors(FileInterceptor('avatarUrl'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user account' })
  async updateCurrentUserAccount(
    @CurrentAccount() account: ContextUser,
    @Body() updateCustomerAccountDto: UpdateCustomerAccountDto,
    @UploadedFile() avatarUrl: Express.Multer.File
  ): Promise<SuccessResponse<AccountResponseDto>> {
    const updatedAccount = await this.accountService.updateCustomerAccount(
      account.id,
      updateCustomerAccountDto,
      avatarUrl
    );
    const result = new AccountResponseDto(updatedAccount);
    return this.success(result);
  }

  @Put('me/passwords')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update account passwords',
    description: 'Update the passwords for an existing account'
  })
  async resetPassword(
    @CurrentAccount() account: ContextUser,
    @Body() resetPasswordDto: ResetPasswordDto
  ): Promise<SuccessResponse<null>> {
    await this.accountService.resetPassword(account.id, resetPasswordDto);
    return this.success(null);
  }

  // Admins + Staff
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new admin account'
  })
  async createAdminAccount(
    @Body() createAdminAccountDto: CreateAccountDto
  ): Promise<SuccessResponse<AccountResponseDto>> {
    const newAdminAccount = await this.accountService.createAccount(
      createAdminAccountDto,
      RoleName.ADMIN
    );
    const response = new AccountResponseDto(newAdminAccount);
    return this.created(response);
  }

  @Post('staff')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new staff account'
  })
  async createStaffAccount(
    @Body() createStaffAccountDto: CreateStaffAccountDto,
    @CurrentAccount() account: ContextUser
  ): Promise<SuccessResponse<AccountResponseDto>> {
    const newStaffAccount = await this.accountService.createAccount(
      {
        email: createStaffAccountDto.email,
        password: createStaffAccountDto.password,
        branchId: account.branchId,
        phoneNumber: createStaffAccountDto.phoneNumber,
        fullName: createStaffAccountDto.fullName
      },
      RoleName.STAFF
    );
    const response = new AccountResponseDto(newStaffAccount);
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
    const paginatedResult = await this.accountService.getAllAccountByRoleName(
      adminAccountDto,
      RoleName.ADMIN
    );

    const response: IPaginatedResponse<AccountResponseDto> = {
      items: paginatedResult.items.map((account) => new AccountResponseDto(account)),
      meta: paginatedResult.meta
    };

    return this.success(response);
  }

  @Get('staff')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all staff accounts',
    description: 'Retrieve all accounts that have staff role with pagination'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of staff accounts retrieved successfully with pagination',
    type: IPaginatedResponse<AccountResponseDto>
  })
  async getAllStaffAccounts(
    @Query() staffAccountDto: AdminAccountDto,
    @CurrentAccount() account: ContextUser
  ): Promise<SuccessResponse<IPaginatedResponse<AccountResponseDto>>> {
    const paginatedResult = await this.accountService.getAllAccountByRoleName(
      staffAccountDto,
      RoleName.STAFF,
      account.branchId
    );

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

  @Put('/staff/:id')
  @HttpCode(HttpStatus.OK)
  async updateStaffAccount(
    @Param('id') id: string,
    @Body() updateStaffAccountDto: UpdateStaffAccountDto
  ): Promise<SuccessResponse<AccountResponseDto>> {
    const updatedAccount = await this.accountService.updateAccount(id, {
      status: updateStaffAccountDto.status
    });
    const response = new AccountResponseDto(updatedAccount);
    return this.success(response);
  }
}
