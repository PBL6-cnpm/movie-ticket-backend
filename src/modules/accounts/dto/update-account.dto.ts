import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { BaseAccountDto } from './base-account.dto';

export class UpdateAccountDto extends PartialType(BaseAccountDto) {
  @ApiPropertyOptional({ description: 'List of Role IDs to assign to the account' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: string[];
}
