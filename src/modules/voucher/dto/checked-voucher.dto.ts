import { ApiProperty } from '@nestjs/swagger';
import { Voucher } from '@shared/db/entities/voucher.entity';

export class CheckedVoucherDto {
  @ApiProperty({ description: 'Unique ID of the voucher' })
  id: string;

  @ApiProperty({ description: 'Display name of the voucher' })
  name: string;

  @ApiProperty({ description: 'Voucher code' })
  code: string;

  @ApiProperty({ description: 'Discount percentage (if applicable)', nullable: true })
  discountPercent: number | null;

  @ApiProperty({
    description: 'Maximum discount value for percentage discount (if applicable)',
    nullable: true
  })
  maxDiscountValue: number | null;

  @ApiProperty({ description: 'Fixed discount amount (if applicable)', nullable: true })
  discountValue: number | null;

  @ApiProperty({
    description: 'Minimum order value required to apply (if applicable)',
    nullable: true
  })
  minimumOrderValue: number | null;

  constructor(voucher: Voucher) {
    this.id = voucher.id;
    this.name = voucher.name;
    this.code = voucher.code;
    this.discountPercent = voucher.discountPercent;
    this.maxDiscountValue = voucher.maxDiscountValue;
    this.discountValue = voucher.discountValue;
    this.minimumOrderValue = voucher.minimumOrderValue;
  }
}

export class CheckedVoucherWithFinalPriceDto {
  @ApiProperty({ description: 'Final price after applying the voucher' })
  finalPrice: number;

  @ApiProperty({ description: 'Voucher code' })
  code: string;

  @ApiProperty({ description: 'Total amount ' })
  price: number;

  @ApiProperty({ description: 'Amount of voucher' })
  voucherAmount: number;
}
