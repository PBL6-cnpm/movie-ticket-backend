import { BaseService } from '@bases/base-service';
import { RESPONSE_MESSAGES } from '@common/constants';
import { AccountStatus, RoleName } from '@common/enums';
import { BadRequest, NotFound } from '@common/exceptions';
import { IPaginatedResponse } from '@common/types/pagination-base.type';
import PaginationHelper from '@common/utils/pagination.util';
import { RoleService } from '@modules/roles/role.service';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountRole } from '@shared/db/entities/account-role.entity';
import { Account } from '@shared/db/entities/account.entity';
import { CloudinaryService } from '@shared/modules/cloudinary/cloudinary.service';
import * as bcrypt from 'bcryptjs';
import { Not, Repository } from 'typeorm';
import { CreateAccountDto } from './dto/create-account.dto';
import { SearchAccountDto } from './dto/search-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ResetPasswordDto, UpdateCustomerAccountDto } from './dto/update-customer-account.dto';

@Injectable()
export class AccountService extends BaseService<Account> {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(AccountRole)
    private readonly accountRoleRepo: Repository<AccountRole>,
    private readonly roleService: RoleService,

    private readonly cloudinaryService: CloudinaryService
  ) {
    super(accountRepo);
  }

  async createAccount(createAccountDto: CreateAccountDto, roleName: RoleName): Promise<Account> {
    // Get role
    const role = await this.roleService.getRoleByName(roleName);

    if (!role) {
      throw new BadRequest(RESPONSE_MESSAGES.ROLE_NOT_FOUND);
    }

    // Create AccountRole by role name
    const accountRole = new AccountRole();
    accountRole.roleId = role.id;
    accountRole.role = role;

    const existingAccount = await this.findOne({ where: { email: createAccountDto.email } });
    if (existingAccount) {
      throw new ConflictException(RESPONSE_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(createAccountDto.password, 10);

    const newAccount = this.accountRepo.create({
      email: createAccountDto.email,
      password: hashedPassword,
      fullName: createAccountDto.fullName,
      phoneNumber: createAccountDto.phoneNumber,
      branchId: createAccountDto.branchId,
      status: AccountStatus.ACTIVE,
      accountRoles: [accountRole]
    });

    const savedAccount = await this.accountRepo.save(newAccount);

    const accountWithRelations = await this.findOneById(savedAccount.id, {
      relations: ['branch', 'accountRoles', 'accountRoles.role']
    });

    if (!accountWithRelations) {
      throw new BadRequest(RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    return accountWithRelations;
  }

  async getAccountById(accountId: string): Promise<Account | null> {
    return this.findOne({
      where: {
        id: accountId,
        status: Not(AccountStatus.DELETED)
      },
      relations: ['branch']
    });
  }

  async getAllAccountByRoleName(
    adminAccountDto: {
      limit: number;
      offset: number;
      search?: string;
    },
    roleName: RoleName,
    branchId?: string
  ): Promise<IPaginatedResponse<Account>> {
    const { limit, offset, search } = adminAccountDto;

    const queryBuilder = this.accountRepo
      .createQueryBuilder('account')
      .innerJoin('account.accountRoles', 'accountRole')
      .innerJoin('accountRole.role', 'role', 'role.name = :roleName', {
        roleName: roleName
      })
      .leftJoinAndSelect('account.branch', 'branch')
      .leftJoinAndSelect('account.accountRoles', 'allAccountRoles')
      .leftJoinAndSelect('allAccountRoles.role', 'allRoles');
    // .where('account.status != :deletedStatus', {
    //   deletedStatus: AccountStatus.DELETED
    // });

    // Thêm điều kiện tìm kiếm nếu có
    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(LOWER(account.fullName) LIKE LOWER(:search) OR LOWER(account.email) LIKE LOWER(:search))',
        { search: `%${search.trim()}%` }
      );
    }

    if (branchId && branchId.trim()) {
      queryBuilder.andWhere('account.branchId = :branchId', {
        branchId: branchId.trim()
      });
    }

    // Đếm tổng số records
    const total = await queryBuilder.getCount();

    // Lấy records với pagination
    const accounts = await queryBuilder
      .orderBy('account.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return PaginationHelper.pagination({
      items: accounts,
      totalItems: total,
      limit,
      offset
    });
  }

  async updateAccount(accountId: string, updateAccountDto: UpdateAccountDto): Promise<Account> {
    // Check if account exists
    const existingAccount = await this.findOneById(accountId);
    if (!existingAccount) {
      throw new BadRequest(RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    // Check if email exists (if updating email)
    if (updateAccountDto.email && updateAccountDto.email !== existingAccount.email) {
      const emailExists = await this.findOne({ where: { email: updateAccountDto.email } });
      if (emailExists) {
        throw new ConflictException(RESPONSE_MESSAGES.EMAIL_ALREADY_EXISTS);
      }
    }

    // Hash password (if updating password)
    const updateData = { ...updateAccountDto };
    delete updateData.roleIds; // remove roleIds from updateData because it will be handled after

    if (updateAccountDto.password) {
      updateData.password = await bcrypt.hash(updateAccountDto.password, 10);
    }

    // Update account
    await this.updateById(accountId, updateData);

    // Update roles
    if (updateAccountDto.roleIds && updateAccountDto.roleIds.length > 0) {
      // Remove all current roles of the account
      await this.accountRoleRepo.delete({ accountId: accountId });

      // Assign new roles
      const newAccountRoles = updateAccountDto.roleIds.map((roleId) => {
        const accountRole = new AccountRole();
        accountRole.accountId = accountId;
        accountRole.roleId = roleId;
        return accountRole;
      });

      await this.accountRoleRepo.save(newAccountRoles);
    }

    // Return updated account with relations
    const updatedAccount = await this.findOneById(accountId, {
      relations: ['branch', 'accountRoles', 'accountRoles.role']
    });

    if (!updatedAccount) {
      throw new BadRequest(RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    return updatedAccount;
  }

  async searchAccounts(searchDto: SearchAccountDto): Promise<IPaginatedResponse<Account>> {
    const { name, email, phoneNumber, limit = 10, offset = 0 } = searchDto;

    const queryBuilder = this.accountRepo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.branch', 'branch')
      .leftJoinAndSelect('account.accountRoles', 'accountRole')
      .leftJoinAndSelect('accountRole.role', 'role');

    // Tìm kiếm theo tên (nếu có)
    if (name && name.trim()) {
      queryBuilder.andWhere('LOWER(account.fullName) LIKE LOWER(:name)', {
        name: `%${name.trim()}%`
      });
    }

    // Tìm kiếm theo email (nếu có)
    if (email && email.trim()) {
      queryBuilder.andWhere('LOWER(account.email) LIKE LOWER(:email)', {
        email: `%${email.trim()}%`
      });
    }

    // Tìm kiếm theo số điện thoại (nếu có)
    if (phoneNumber && phoneNumber.trim()) {
      queryBuilder.andWhere('LOWER(account.phoneNumber) LIKE LOWER(:phoneNumber)', {
        phoneNumber: `%${phoneNumber.trim()}%`
      });
    }

    // Đếm tổng số records
    const total = await queryBuilder.getCount();

    // Lấy records với pagination
    const accounts = await queryBuilder
      .orderBy('account.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return PaginationHelper.pagination({
      items: accounts,
      totalItems: total,
      limit,
      offset
    });
  }

  async getProfile(accountId: string): Promise<Account> {
    const account = await this.getAccountById(accountId);

    if (!account) {
      throw new NotFound(RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    return account;
  }

  async updateCustomerAccount(
    accountId: string,
    updateCustomerAccountDto: UpdateCustomerAccountDto,
    avatarUrl?: Express.Multer.File
  ): Promise<Account> {
    const existingAccount = await this.findOneById(accountId);
    if (!existingAccount) {
      throw new BadRequest(RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    // Check if email exists (if updating email)
    if (
      updateCustomerAccountDto.email &&
      updateCustomerAccountDto.email !== existingAccount.email
    ) {
      const emailExists = await this.findOne({ where: { email: updateCustomerAccountDto.email } });
      if (emailExists) {
        throw new ConflictException(RESPONSE_MESSAGES.EMAIL_ALREADY_EXISTS);
      }
    }

    // Upload avatar to Cloudinary (if provided)
    let cloudUrl = '';
    if (avatarUrl) {
      cloudUrl = await this.cloudinaryService.uploadFileBuffer(avatarUrl);
    }

    await this.accountRepo.update(accountId, {
      ...updateCustomerAccountDto,
      ...(cloudUrl && { avatarUrl: cloudUrl })
    });

    const updatedAccount = await this.findOneById(accountId);

    return updatedAccount;
  }

  async resetPassword(accountId: string, resetPasswordDto: ResetPasswordDto): Promise<void> {
    const existingAccount = await this.findOneById(accountId);
    if (!existingAccount) {
      throw new BadRequest(RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      resetPasswordDto.currentPassword,
      existingAccount.password
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    // Hash new password and update account
    const hashedNewPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    await this.accountRepo.update(accountId, { password: hashedNewPassword });
  }
}
