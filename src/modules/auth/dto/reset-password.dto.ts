import { RESPONSE_MESSAGES } from '@common/constants';
import { Match } from '@common/validators/match.validator';
import { BaseAccountDto } from '@modules/accounts/dto/base-account.dto';
import { PickType } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ResetPasswordDto extends PickType(BaseAccountDto, ['password'] as const) {
  @IsString()
  token: string;

  @IsString()
  @Match('password', { message: RESPONSE_MESSAGES.PASSWORD_CONFIRM_NOT_MATCH.message })
  confirmPassword: string;
}
