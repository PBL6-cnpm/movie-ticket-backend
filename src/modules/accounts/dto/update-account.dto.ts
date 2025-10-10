import { AccountStatus } from '@common/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateAccountDto {
  @ApiPropertyOptional({
    description: 'Tên đầy đủ của tài khoản',
    example: 'Nguyễn Văn A Updated'
  })
  @IsOptional()
  @IsString({ message: 'Tên đầy đủ phải là chuỗi ký tự' })
  fullName: string;

  @ApiPropertyOptional({
    description: 'Email của tài khoản',
    example: 'updated@example.com'
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiPropertyOptional({
    description: 'Mật khẩu mới',
    example: 'NewPassword123',
    minLength: 6
  })
  @IsOptional()
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  password?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại',
    example: '0987654321'
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'ID chi nhánh',
    example: 'branch-uuid-here'
  })
  @IsOptional()
  @IsUUID('4', { message: 'Branch ID phải là UUID hợp lệ' })
  branchId: string;

  @ApiPropertyOptional({
    description: 'Trạng thái tài khoản',
    enum: AccountStatus,
    example: AccountStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(AccountStatus, { message: 'Trạng thái tài khoản không hợp lệ' })
  status?: AccountStatus;

  @ApiPropertyOptional({
    description: 'URL avatar',
    example: 'https://example.com/avatar.jpg'
  })
  @IsOptional()
  @IsString({ message: 'Avatar URL phải là chuỗi ký tự' })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Số coin của tài khoản',
    example: 100
  })
  @IsOptional()
  coin?: number;

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
