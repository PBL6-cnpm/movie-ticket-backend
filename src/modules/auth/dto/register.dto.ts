import { BaseAccountDto } from '@modules/accounts/dto/base-account.dto';
import { PickType } from '@nestjs/swagger';

export class RegisterDto extends PickType(BaseAccountDto, [
  'email',
  'password',
  'fullName'
] as const) {}
