import { PaginationDto } from '@common/types/pagination-base.type';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminAccountDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Tìm kiếm admin theo tên (có thể tìm từng phần)',
    example: 'Admin'
  })
  search?: string;
}
