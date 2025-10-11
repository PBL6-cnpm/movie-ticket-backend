import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { BaseAccountDto } from './base-account.dto';

export class CreateAdminAccountDto extends PickType(BaseAccountDto, [
  'email',
  'password',
  'fullName',
  'phoneNumber'
]) {
  @ApiProperty({
    description: 'ID chi nhánh (tùy chọn cho admin)',
    example: 'branch-uuid-here',
    required: false
  })
  @IsNotEmpty()
  @IsUUID('4', { message: 'Branch ID phải là UUID hợp lệ' })
  branchId: string;
}
