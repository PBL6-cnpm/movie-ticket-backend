import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches
} from 'class-validator';
import { UserStatus } from '@common/enums';
import { RESPONSE_MESSAGES } from 'common/constants/response-message.constant';
import { AccountStatus } from '@common/enums/account.enum';

export class BaseUserDto {
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
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: RESPONSE_MESSAGES.PASSWORD_MISSING_REQUIREMENTS.message
  })
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Status of the user',
    enum: UserStatus,
    default: UserStatus.INACTIVE,
    required: false
  })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: AccountStatus;
}
