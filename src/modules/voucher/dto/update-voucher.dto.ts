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
    description: 'Voucher name',
    example: 'Summer discount'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Voucher code (unique)',
    example: 'SUMMER2024'
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Available voucher quantity',
    example: 100
  })
  @IsInt()
  @Min(0)
  number: number;

  @ApiProperty({
    description: 'Discount percentage (0-100)',
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
    description: 'Maximum discount value when using percentage discount',
    example: 50000,
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscountValue?: number | null;

  @ApiProperty({
    description: 'Fixed discount value',
    example: 30000,
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountValue?: number | null;

  @ApiProperty({
    description: 'Minimum order value to apply voucher',
    example: 100000,
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minimumOrderValue?: number | null;

  @ApiProperty({
    description: 'Valid from date',
    example: '2024-06-01T00:00:00Z',
    required: false,
    nullable: true
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date | null;

  @ApiProperty({
    description: 'Valid to date',
    example: '2024-08-31T23:59:59Z',
    required: false,
    nullable: true
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validTo?: Date | null;

  @ApiProperty({
    description: 'Private voucher (only for special customers)',
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
