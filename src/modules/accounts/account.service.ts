import { BaseService } from '@bases/base-service';
import { RESPONSE_MESSAGES } from '@common/constants';
import { AccountStatus, RoleName } from '@common/enums';
import { BadRequest } from '@common/exceptions';
import { IPaginatedResponse } from '@common/types/pagination-base.type';
import PaginationHelper from '@common/utils/pagination.util';
import { RoleService } from '@modules/roles/role.service';

import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountRole } from '@shared/db/entities/account-role.entity';
import { Account } from '@shared/db/entities/account.entity';
import * as bcrypt from 'bcryptjs';
import { Not, Repository } from 'typeorm';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { SearchAccountDto } from './dto/search-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountService extends BaseService<Account> {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(AccountRole)
    private readonly accountRoleRepo: Repository<AccountRole>,
    private readonly roleService: RoleService
  ) {
    super(accountRepo);
  }

  async createAccount(createAccountDto: CreateAccountDto): Promise<Account> {
    const existingAccount = await this.findOne({
      where: { email: createAccountDto.email }
    });
    if (existingAccount) {
      throw new BadRequest(RESPONSE_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createAccountDto.password, 10);

    // Create new account
    const newAccount = await this.create({
      ...createAccountDto,
      password: hashedPassword,
      status: createAccountDto.status || AccountStatus.PENDING
    });

    return newAccount;
  }

  async createAdminAccount(createAdminAccountDto: CreateAdminAccountDto): Promise<Account> {
    // Kiểm tra email đã tồn tại
    const existingAccount = await this.findOne({ where: { email: createAdminAccountDto.email } });
    if (existingAccount) {
      throw new ConflictException(RESPONSE_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Lấy ADMIN role
    const adminRole = await this.roleService.getRoleByName(RoleName.ADMIN);

    // Hash password
    const hashedPassword = await bcrypt.hash(createAdminAccountDto.password, 10);

    // Tạo AccountRole object cho ADMIN
    const adminAccountRole = new AccountRole();
    adminAccountRole.roleId = adminRole.id;
    adminAccountRole.role = adminRole;

    // Tạo account mới với role ADMIN (cascade sẽ tự động save AccountRole)
    const newAccount = this.accountRepo.create({
      email: createAdminAccountDto.email,
      password: hashedPassword,
      fullName: createAdminAccountDto.fullName,
      phoneNumber: createAdminAccountDto.phoneNumber,
      branchId: createAdminAccountDto.branchId,
      status: AccountStatus.ACTIVE,
      accountRoles: [adminAccountRole]
    });

    const savedAccount = await this.accountRepo.save(newAccount);

    // Load lại account với relations
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
      }
    });
  }

  async getAllAdminAccounts(adminAccountDto: {
    limit: number;
    offset: number;
    search?: string;
  }): Promise<IPaginatedResponse<Account>> {
    const { limit, offset, search } = adminAccountDto;

    const queryBuilder = this.accountRepo
      .createQueryBuilder('account')
      .innerJoin('account.accountRoles', 'accountRole')
      .innerJoin('accountRole.role', 'role', 'role.name = :roleName', {
        roleName: RoleName.ADMIN
      })
      .leftJoinAndSelect('account.branch', 'branch')
      .leftJoinAndSelect('account.accountRoles', 'allAccountRoles')
      .leftJoinAndSelect('allAccountRoles.role', 'allRoles')
      .where('account.status != :deletedStatus', {
        deletedStatus: AccountStatus.DELETED
      });

    // Thêm điều kiện tìm kiếm nếu có
    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(LOWER(account.fullName) LIKE LOWER(:search) OR LOWER(account.email) LIKE LOWER(:search))',
        { search: `%${search.trim()}%` }
      );
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
    // Kiểm tra account có tồn tại không
    const existingAccount = await this.findOneById(accountId);
    if (!existingAccount) {
      throw new BadRequest(RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    // Kiểm tra email đã tồn tại (nếu có update email)
    if (updateAccountDto.email && updateAccountDto.email !== existingAccount.email) {
      const emailExists = await this.findOne({ where: { email: updateAccountDto.email } });
      if (emailExists) {
        throw new ConflictException(RESPONSE_MESSAGES.EMAIL_ALREADY_EXISTS);
      }
    }

    // Hash password nếu có cập nhật password
    const updateData = { ...updateAccountDto };
    delete updateData.roleIds; // Loại bỏ roleIds khỏi updateData vì sẽ xử lý riêng

    if (updateAccountDto.password) {
      updateData.password = await bcrypt.hash(updateAccountDto.password, 10);
    }

    // Cập nhật account
    await this.updateById(accountId, updateData);

    // Cập nhật roles nếu có
    if (updateAccountDto.roleIds && updateAccountDto.roleIds.length > 0) {
      // Xóa tất cả roles hiện tại của account
      await this.accountRoleRepo.delete({ accountId: accountId });

      // Gán roles mới
      const newAccountRoles = updateAccountDto.roleIds.map((roleId) => {
        const accountRole = new AccountRole();
        accountRole.accountId = accountId;
        accountRole.roleId = roleId;
        return accountRole;
      });

      await this.accountRoleRepo.save(newAccountRoles);
    }

    // Load lại account với relations
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
}
