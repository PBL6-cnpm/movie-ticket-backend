import { ApiProperty } from '@nestjs/swagger';
import { Voucher } from '@shared/db/entities/voucher.entity';

export class VoucherResponseDto {
  @ApiProperty({ description: 'Voucher ID' })
  id: string;

  @ApiProperty({ description: 'Voucher name' })
  name: string;

  @ApiProperty({ description: 'Voucher code' })
  code: string;

  @ApiProperty({ description: 'Available voucher quantity' })
  number: number;

  @ApiProperty({
    description: 'Discount percentage',
    nullable: true
  })
  discountPercent: number | null;

  @ApiProperty({
    description: 'Maximum discount value for percentage discount',
    nullable: true
  })
  maxDiscountValue: number | null;

  @ApiProperty({
    description: 'Fixed discount value',
    nullable: true
  })
  discountValue: number | null;

  @ApiProperty({
    description: 'Minimum order value',
    nullable: true
  })
  minimumOrderValue: number | null;

  @ApiProperty({
    description: 'Valid from date',
    nullable: true
  })
  validFrom: Date | null;

  @ApiProperty({
    description: 'Valid to date',
    nullable: true
  })
  validTo: Date | null;

  @ApiProperty({ description: 'Whether voucher is private' })
  isPrivate: boolean;

  @ApiProperty({ description: 'Created date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Number of bookings that used this voucher',
    required: false
  })
  usedCount?: number;

  constructor(voucher: Voucher, usedCount?: number) {
    this.id = voucher.id;
    this.name = voucher.name;
    this.code = voucher.code;
    this.number = voucher.number;
    this.discountPercent = voucher.discountPercent;
    this.maxDiscountValue = voucher.maxDiscountValue;
    this.discountValue = voucher.discountValue;
    this.minimumOrderValue = voucher.minimumOrderValue;
    this.validFrom = voucher.validFrom;
    this.validTo = voucher.validTo;
    this.isPrivate = voucher.isPrivate;
    this.createdAt = voucher.createdAt;
    this.updatedAt = voucher.updatedAt;

    if (usedCount !== undefined) {
      this.usedCount = usedCount;
    }
  }
}
