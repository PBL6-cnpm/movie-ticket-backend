import { PaginationDto } from '@common/types/pagination-base.type';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchAccountDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên (có thể tìm từng phần)',
    example: 'Nguyen'
  })
  @IsOptional()
  @IsString({ message: 'Tên phải là chuỗi ký tự' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo email (có thể tìm từng phần)',
    example: 'gmail.com'
  })
  @IsOptional()
  @IsString({ message: 'Email phải là chuỗi ký tự' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo số điện thoại (có thể tìm từng phần)',
    example: '0123'
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  phoneNumber?: string;
}
