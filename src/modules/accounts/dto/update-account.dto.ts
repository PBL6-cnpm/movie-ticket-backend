import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { BaseAccountDto } from './base-account.dto';

export class UpdateAccountDto extends PickType(BaseAccountDto, ['status']) {
  @ApiProperty({ description: 'Branch ID' })
  @IsNotEmpty()
  @IsUUID('4')
  branchId?: string;

  @ApiPropertyOptional({ description: 'List of Role IDs to assign to the account' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: string[];
}
