import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateBranchDto {
  @ApiPropertyOptional({
    description: 'The name of the branch',
    example: 'CGV Vincom Updated',
    minLength: 2,
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Branch name must be a string' })
  @MinLength(2, { message: 'Branch name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Branch name must not exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'The address of the branch',
    example: '191 Ba Tháng Hai, Phường 12, Quận 10, TP.HCM (Updated)',
    minLength: 10,
    maxLength: 255
  })
  @IsOptional()
  @IsString({ message: 'Branch address must be a string' })
  @MinLength(10, { message: 'Branch address must be at least 10 characters long' })
  @MaxLength(255, { message: 'Branch address must not exceed 255 characters' })
  address?: string;
}
