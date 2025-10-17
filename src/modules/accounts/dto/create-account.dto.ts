import { PickType } from '@nestjs/swagger';
import { BaseAccountDto } from './base-account.dto';

export class CreateAccountDto extends PickType(BaseAccountDto, [
  'email',
  'password',
  'fullName',
  'phoneNumber',
  'branchId'
]) {}
