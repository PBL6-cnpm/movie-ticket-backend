import { RESPONSE_MESSAGES } from '@common/constants';
import { Match } from '@common/validators/match.validator';
import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsStrongPassword, MaxLength, MinLength } from 'class-validator';
import { BaseAccountDto } from './base-account.dto';

export class UpdateCustomerAccountDto extends PartialType(
  PickType(BaseAccountDto, ['email', 'fullName', 'phoneNumber', 'avatarUrl'] as const)
) {}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Old password' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

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
  @IsNotEmpty()
  newPassword: string;

  @ApiProperty({ description: 'Password confirmation' })
  @IsString()
  @Match('newPassword', { message: RESPONSE_MESSAGES.PASSWORD_CONFIRM_NOT_MATCH.message })
  @IsNotEmpty()
  confirmPassword: string;
}
