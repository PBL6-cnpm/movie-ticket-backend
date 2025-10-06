import { RESPONSE_MESSAGES } from '@common/constants';
import { AccountStatus, RoleName } from '@common/enums';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength
} from 'class-validator';

export class BaseAccountDto {
  @ApiProperty({ description: 'Email of the user' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

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
  password: string;

  @ApiProperty({
    description: 'Status of the account',
    enum: AccountStatus,
    default: AccountStatus.PENDING,
    required: false
  })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;

  @ApiProperty({
    description: 'Role name of the account',
    enum: RoleName,
    required: true
  })
  @IsEnum(RoleName)
  @IsNotEmpty()
  roleName: RoleName;

  @ApiProperty({ description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Phone number of the user', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ description: 'Avatar URL of the user', required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
