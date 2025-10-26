import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';

export class BaseSpecialDateDto {
  @ApiProperty({ description: 'date special' })
  @IsDate()
  @IsNotEmpty()
  date: Date;

  @ApiProperty({
    description: 'Price add of date'
  })
  @IsNumber()
  @IsNotEmpty()
  additionalPrice: number;
}
