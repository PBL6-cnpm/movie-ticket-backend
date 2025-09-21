import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyCodeDto {
  @ApiProperty({ description: 'Token for verification' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'One-time password (OTP) for verification' })
  @IsNotEmpty()
  @MaxLength(6, { message: RESPONSE_MESSAGES.INVALID_CODE_LENGTH.message })
  code: string;
}
