import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
export class RefreshmentItemDto {
  @ApiProperty({
    type: String,
    description: 'ID of refreshment'
  })
  @IsUUID()
  refreshmentId: string;

  @ApiProperty({
    type: Number,
    description: 'Quantity of the refreshment',
    minimum: 1
  })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class AdditionalPriceDto {
  @ApiPropertyOptional({
    type: String,
    description: 'ID of the type day'
  })
  @IsUUID()
  additionalTypeDayId?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'ID of the special date'
  })
  @IsUUID()
  additionalSpecialDateId?: string;

  @ApiProperty({
    type: Number,
    description: 'Additional price amount',
    minimum: 0
  })
  @IsInt()
  @Min(0)
  additionalPrice: number;
}

export class QueryHoldBookingDto {
  @ApiProperty({
    type: String
  })
  @IsUUID()
  showTimeId: string;

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'List of seat IDs to hold'
  })
  @IsUUID('4', { each: true })
  seatIds: string[];

  @ApiPropertyOptional({
    type: String,
    description: 'Optional voucher code for discounts'
  })
  @IsString()
  voucherCode?: string;

  @ApiPropertyOptional({
    type: RefreshmentItemDto,
    isArray: true,
    description: 'List of refreshments to include'
  })
  @ValidateNested({ each: true })
  @Type(() => RefreshmentItemDto)
  refreshmentsOption?: RefreshmentItemDto[];
}
