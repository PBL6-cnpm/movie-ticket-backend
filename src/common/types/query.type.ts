import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class WhereInputDto {
  @IsNotEmpty()
  @IsString()
  fieldName: string;

  @IsNotEmpty()
  value: any;
}

export class RangeNumberQueryDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  fieldName: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ nullable: true })
  eq: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ nullable: true })
  ne: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ nullable: true })
  gte: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ nullable: true })
  lte: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ nullable: true })
  gt: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ nullable: true })
  lt: number;

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({ type: [Number], nullable: true })
  in: number[];

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({ type: [Number], nullable: true })
  nin: number[];
}

export class SearchInputDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  fieldName: string;

  @IsNotEmpty()
  @ApiProperty()
  keyword: string;
}
