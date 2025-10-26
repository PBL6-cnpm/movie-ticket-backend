import { DayOfWeek } from '@common/enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class BaseTypeDayDto {
  @ApiProperty({
    description: 'Day Of week',
    enum: DayOfWeek,
    required: true
  })
  @IsNotEmpty()
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({
    description: 'Price of day add'
  })
  @IsNumber()
  @IsNotEmpty()
  additionalPrice: number;

  @ApiProperty({ description: 'Is the type day currently in use?' })
  @IsBoolean()
  @IsOptional()
  isCurrent: boolean;
}
