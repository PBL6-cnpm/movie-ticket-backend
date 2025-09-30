import { SortType } from '@common/constants';
import { OrderValidator } from '@common/validators/order.validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { IsNotEmpty, IsNumber, IsOptional, IsString, Validate } from 'class-validator';

export class IMeta {
  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;

  @ApiProperty()
  total: number;

  @ApiPropertyOptional({ nullable: true })
  totalPages?: number;
}

export interface ISortInput {
  sortBy: string;
  sortType: SortType;
}

export class IPaginatedResponse<T> {
  @ApiProperty()
  items: T[];

  @ApiProperty()
  meta: IMeta;
}

export interface FilterPaginationOutput<T> {
  items: T[];
  total: number;
}

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ type: Number, default: 10 })
  readonly limit: number = 10;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ type: Number, default: 0 })
  readonly offset: number = 0;
}

export class OrderDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional({
    description: 'Format: fieldName:[asc,desc]',
    nullable: true
  })
  @Validate(OrderValidator)
  order: string;
}

export class SortInputDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  sortBy: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ enum: SortType })
  sortType: SortType;
}
