import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';

export class SearchVoucherDto {
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm (tìm trong code hoặc name)',
    example: 'SUMMER'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo loại voucher: true = private, false = public, không truyền = tất cả',
    example: false,
    type: Boolean
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Ngày bắt đầu của khoảng thời gian hiệu lực',
    example: '2024-06-01T00:00:00Z',
    type: Date
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFromStart?: Date;

  @ApiPropertyOptional({
    description: 'Ngày kết thúc của khoảng thời gian hiệu lực',
    example: '2024-12-31T23:59:59Z',
    type: Date
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validToEnd?: Date;
}
