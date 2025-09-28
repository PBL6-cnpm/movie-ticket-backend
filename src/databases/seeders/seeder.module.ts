import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from 'shared/db/entities/permission.entity';
import { RolePermission } from 'shared/db/entities/role-permission.entity';
import { Role } from 'shared/db/entities/role.entity';
import { DatabaseModule } from '../database.module';
import { SeederService } from './seeder.service';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Role, Permission, RolePermission])],
  providers: [SeederService],
  exports: [SeederService]
})
export class SeederModule {}
