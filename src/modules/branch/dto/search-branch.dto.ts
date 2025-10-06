import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SearchBranchDto {
  @ApiPropertyOptional({
    description: 'Search term to find branches by name or address',
    example: 'CGV',
    minLength: 1,
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @MinLength(1, { message: 'Search term must be at least 1 character long' })
  @MaxLength(100, { message: 'Search term must not exceed 100 characters' })
  search?: string;
}
