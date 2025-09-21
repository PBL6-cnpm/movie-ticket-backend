import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { DatabaseModule } from '../database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'shared/db/entities/role.entity';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Role])],
  providers: [SeederService],
  exports: [SeederService]
})
export class SeederModule {}
