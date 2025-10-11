import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class BaseBranchDto {
  @ApiProperty({
    description: 'The name of the branch',
    example: 'CGV Vincom',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty({ message: 'Branch name is required' })
  @IsString({ message: 'Branch name must be a string' })
  @MinLength(2, { message: 'Branch name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Branch name must not exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'The address of the branch',
    example: '191 Ba Tháng Hai, Phường 12, Quận 10, TP.HCM',
    minLength: 10,
    maxLength: 255
  })
  @IsNotEmpty({ message: 'Branch address is required' })
  @IsString({ message: 'Branch address must be a string' })
  @MinLength(10, { message: 'Branch address must be at least 10 characters long' })
  @MaxLength(255, { message: 'Branch address must not exceed 255 characters' })
  address: string;
}
