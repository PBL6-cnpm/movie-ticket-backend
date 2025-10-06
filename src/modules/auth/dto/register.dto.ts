import { BaseAccountDto } from '@modules/accounts/dto/base-account.dto';
import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class RegisterDto extends PickType(BaseAccountDto, [
  'email',
  'password',
  'fullName'
] as const) {
  @ApiPropertyOptional()
  @IsOptional()
  fullName: string;
}
