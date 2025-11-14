import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested
} from 'class-validator';
import { RefreshmentItemDto } from './query-hold-booking.dto';

export class PaymentConfirmationAndroidDto {
  @ApiProperty({
    description: 'The ID of the booking being confirmed.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
  })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiPropertyOptional({
    description: 'Array of selected refreshments and their quantities.',
    type: [RefreshmentItemDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefreshmentItemDto)
  refreshmentsOption?: RefreshmentItemDto[];

  @ApiProperty({
    description: 'Indicates whether the payment was confirmed.',
    example: true
  })
  @IsBoolean()
  paymentConfirmed: boolean;

  @ApiPropertyOptional({
    description: 'A voucher code to apply to the booking.',
    example: 'DISCOUNT10'
  })
  @IsOptional()
  @IsString()
  voucherCode?: string;
}
