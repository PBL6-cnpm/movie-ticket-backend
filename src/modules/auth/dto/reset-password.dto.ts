import { IsString } from 'class-validator';
import { BaseAccountDto } from '@modules/accounts/dto/base-account.dto';
import { PickType } from '@nestjs/swagger';
import { Match } from '@common/validators/match.validator';
import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';

export class ResetPasswordDto extends PickType(BaseAccountDto, ['password'] as const) {
  @IsString()
  token: string;

  @IsString()
  @Match('password', { message: RESPONSE_MESSAGES.PASSWORD_CONFIRM_NOT_MATCH.message })
  confirmPassword: string;
}
