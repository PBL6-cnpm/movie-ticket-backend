import { RESPONSE_MESSAGES } from '@common/constants';
import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUUID,
  MaxLength,
  MinLength
} from 'class-validator';
import { BaseAccountDto } from './base-account.dto';

export class UpdateAccountDto extends PickType(BaseAccountDto, [
  'email',
  'fullName',
  'phoneNumber',
  'status',
  'branchId'
]) {
  @ApiPropertyOptional({ description: 'List of Role IDs to assign to the account' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: string[];

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
