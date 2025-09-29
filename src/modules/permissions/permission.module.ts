import { RolePermissionModule } from '@modules/role-permission/role-permission.module';
import { RoleModule } from '@modules/roles/role.module';
import { Module } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';

@Module({
  imports: [RoleModule, RolePermissionModule],
  controllers: [PermissionController],
  providers: [PermissionService],
  exports: [PermissionService]
})
export class PermissionModule {}
