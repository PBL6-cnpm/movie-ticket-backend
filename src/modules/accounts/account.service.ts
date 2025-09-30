import { BaseService } from '@bases/base-service';
import { RESPONSE_MESSAGES } from '@common/constants';
import { AccountStatus } from '@common/enums';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Account } from 'shared/db/entities/account.entity';
import { Not, Repository } from 'typeorm';
import { CreateAccountDto } from './dto/create-account.dto';
import { BadRequest } from '@common/exceptions';

@Injectable()
export class AccountService extends BaseService<Account> {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>
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

  async getAccountById(accountId: string): Promise<Account> {
    return this.findOne({
      where: {
        id: accountId,
        status: Not(AccountStatus.DELETED)
      }
    });
  }
}
