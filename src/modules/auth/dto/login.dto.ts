import { BaseUserDto } from '@modules/users/dto/base-user.dto';
import { PickType } from '@nestjs/swagger';

export class LoginDto extends PickType(BaseUserDto, [
  'email',
  'password'
] as const) {}
