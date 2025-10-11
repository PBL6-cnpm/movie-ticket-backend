import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { BaseAccountDto } from './base-account.dto';

export class UpdateAccountDto extends PickType(BaseAccountDto, [
  'fullName',
  'email',
  'phoneNumber',
  'status'
]) {
  @ApiPropertyOptional({
    description: 'Mật khẩu mới',
    example: 'NewPassword123',
    minLength: 6
  })
  @IsOptional()
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  password?: string;

  @ApiPropertyOptional({
    description: 'ID chi nhánh',
    example: 'branch-uuid-here'
  })
  @IsOptional()
  @IsUUID('4', { message: 'Branch ID phải là UUID hợp lệ' })
  branchId: string;

  @ApiPropertyOptional({
    description: 'URL avatar',
    example: 'https://example.com/avatar.jpg'
  })
  @IsOptional()
  @IsString({ message: 'Avatar URL phải là chuỗi ký tự' })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Danh sách ID các role để gán cho tài khoản',
    example: ['role-uuid-1', 'role-uuid-2'],
    type: [String]
  })
  @IsOptional()
  @IsArray({ message: 'Role IDs phải là một mảng' })
  @IsUUID('4', { each: true, message: 'Mỗi Role ID phải là UUID hợp lệ' })
  roleIds?: string[];
}
