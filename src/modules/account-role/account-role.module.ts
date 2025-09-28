import { Module } from '@nestjs/common';
import { AccountRoleService } from './account-role.service';

@Module({
  providers: [AccountRoleService],
  exports: [AccountRoleService]
})
export class AccountRoleModule {}
