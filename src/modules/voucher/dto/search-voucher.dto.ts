import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';

export class SearchVoucherDto {
  @ApiPropertyOptional({
    description: 'Search keyword (search in code or name)',
    example: 'SUMMER'
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Filter by voucher type: true = private, false = public, not provided = all',
    example: false,
    type: Boolean
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Start date of validity period',
    example: '2024-06-01T00:00:00Z',
    type: Date
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFromStart?: Date;

  @ApiPropertyOptional({
    description: 'End date of validity period',
    example: '2024-12-31T23:59:59Z',
    type: Date
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validToEnd?: Date;
}
