import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateAdminAccountDto {
  @ApiProperty({
    description: 'Email của admin',
    example: 'admin@example.com'
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    description: 'Mật khẩu',
    example: 'AdminPassword123',
    minLength: 6
  })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;

  @ApiProperty({
    description: 'Tên đầy đủ',
    example: 'Admin System'
  })
  @IsString({ message: 'Tên đầy đủ phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên đầy đủ không được để trống' })
  fullName: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789'
  })
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phone: string;

  @ApiProperty({
    description: 'ID chi nhánh (tùy chọn cho admin)',
    example: 'branch-uuid-here',
    required: false
  })
  @IsOptional()
  @IsUUID('4', { message: 'Branch ID phải là UUID hợp lệ' })
  branchId: string;
}
