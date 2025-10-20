import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckVoucherDto {
  @ApiProperty({
    description: 'Voucher code to be checked',
    example: 'SECRETGIFT'
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
