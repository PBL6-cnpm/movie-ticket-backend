import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator';

export class UpdateVoucherDto {
  @ApiProperty({
    description: 'Tên voucher',
    example: 'Giảm giá mùa hè'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Mã voucher (unique)',
    example: 'SUMMER2024'
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Số lượng voucher có sẵn',
    example: 100
  })
  @IsInt()
  @Min(0)
  number: number;

  @ApiProperty({
    description: 'Phần trăm giảm giá (0-100)',
    example: 20,
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number | null;

  @ApiProperty({
    description: 'Giá trị giảm tối đa khi dùng phần trăm giảm giá',
    example: 50000,
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscountValue?: number | null;

  @ApiProperty({
    description: 'Giá trị giảm cố định',
    example: 30000,
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountValue?: number | null;

  @ApiProperty({
    description: 'Giá trị đơn hàng tối thiểu để áp dụng voucher',
    example: 100000,
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minimumOrderValue?: number | null;

  @ApiProperty({
    description: 'Ngày bắt đầu hiệu lực',
    example: '2024-06-01T00:00:00Z',
    required: false,
    nullable: true
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date | null;

  @ApiProperty({
    description: 'Ngày hết hiệu lực',
    example: '2024-08-31T23:59:59Z',
    required: false,
    nullable: true
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validTo?: Date | null;

  @ApiProperty({
    description: 'Voucher riêng tư (chỉ dùng cho khách hàng đặc biệt)',
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
