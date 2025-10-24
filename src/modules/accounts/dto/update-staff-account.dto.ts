import { RESPONSE_MESSAGES } from '@common/constants';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsOptional, IsString, IsStrongPassword, MaxLength, MinLength } from 'class-validator';
import { BaseAccountDto } from './base-account.dto';

export class UpdateStaffAccountDto extends PickType(BaseAccountDto, [
  'email',
  'fullName',
  'phoneNumber',
  'status'
]) {
  @ApiProperty({
    description:
      'Password for the user account (minimum 8 characters, must contain at least one uppercase letter, one lowercase letter, one number, and one special character)',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    {
      message: RESPONSE_MESSAGES.PASSWORD_MISSING_REQUIREMENTS.message
    }
  )
  @IsOptional()
  password?: string;
}
