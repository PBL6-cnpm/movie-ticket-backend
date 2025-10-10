import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class BaseTypeSeatDto {
  @ApiProperty({ description: 'Name of the type seat' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Price of the type seat' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  price: number;

  @ApiProperty({ description: 'Is the type seat currently in use?' })
  @IsBoolean()
  @IsOptional()
  isCurrent: boolean;
}
