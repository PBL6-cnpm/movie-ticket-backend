import { RoleModule } from '@modules/roles/role.module';
import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { CloudinaryService } from '@shared/modules/cloudinary/cloudinary.service';

@Module({
  imports: [RoleModule],
  controllers: [AccountController],
  providers: [AccountService, CloudinaryService],
  exports: [AccountService]
})
export class AccountModule {}
