import { RESPONSE_MESSAGES } from '@common/constants';
import { Match } from '@common/validators/match.validator';
import { BaseAccountDto } from '@modules/accounts/dto/base-account.dto';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RegisterDto extends PickType(BaseAccountDto, [
  'email',
  'password',
  'fullName'
] as const) {
  @ApiProperty({ description: 'Confirm password' })
  @IsString()
  @Match('password', { message: RESPONSE_MESSAGES.PASSWORD_CONFIRM_NOT_MATCH.message })
  confirmPassword: string;
}
