import { BaseService } from '@bases/base-service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountRole } from '@shared/db/entities/account-role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AccountRoleService extends BaseService<AccountRole> {
  constructor(
    @InjectRepository(AccountRole)
    private readonly accountRoleRepo: Repository<AccountRole>
  ) {
    super(accountRoleRepo);
  }
}
