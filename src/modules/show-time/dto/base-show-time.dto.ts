import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty } from 'class-validator';

export class BaseShowTimeDto {
  @ApiProperty({ description: 'time start' })
  @IsDate()
  @IsNotEmpty()
  timeStart: Date;

  @ApiProperty({ description: 'show date' })
  @IsDate()
  @IsNotEmpty()
  showDate: Date;
}
