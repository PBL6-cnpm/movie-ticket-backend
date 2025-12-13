import { ApiProperty } from '@nestjs/swagger';
import { Voucher } from '@shared/db/entities/voucher.entity';

export class VoucherResponseDto {
  @ApiProperty({ description: 'ID của voucher' })
  id: string;

  @ApiProperty({ description: 'Tên voucher' })
  name: string;

  @ApiProperty({ description: 'Mã voucher' })
  code: string;

  @ApiProperty({ description: 'Số lượng voucher có sẵn' })
  number: number;

  @ApiProperty({
    description: 'Phần trăm giảm giá',
    nullable: true
  })
  discountPercent: number | null;

  @ApiProperty({
    description: 'Giá trị giảm tối đa cho giảm theo phần trăm',
    nullable: true
  })
  maxDiscountValue: number | null;

  @ApiProperty({
    description: 'Giá trị giảm cố định',
    nullable: true
  })
  discountValue: number | null;

  @ApiProperty({
    description: 'Giá trị đơn hàng tối thiểu',
    nullable: true
  })
  minimumOrderValue: number | null;

  @ApiProperty({
    description: 'Ngày bắt đầu hiệu lực',
    nullable: true
  })
  validFrom: Date | null;

  @ApiProperty({
    description: 'Ngày hết hiệu lực',
    nullable: true
  })
  validTo: Date | null;

  @ApiProperty({ description: 'Voucher riêng tư hay không' })
  isPrivate: boolean;

  @ApiProperty({ description: 'Ngày tạo' })
  createdAt: Date;

  @ApiProperty({ description: 'Ngày cập nhật lần cuối' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Số lượng booking đã sử dụng voucher này',
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
