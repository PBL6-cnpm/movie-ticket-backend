import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDate, IsOptional, IsUUID } from 'class-validator';
import { CreateShowTimeDto } from './create-show-time.dto';

export class UpdateShowTimeDto extends PartialType(CreateShowTimeDto) {
  @ApiPropertyOptional({
    description: 'Movie ID'
  })
  @IsOptional()
  @IsUUID('4', { message: 'Movie ID phải là UUID hợp lệ' })
  movieId?: string;

  @ApiPropertyOptional({
    description: 'Room ID'
  })
  @IsOptional()
  @IsUUID('4', { message: 'Room ID phải là UUID hợp lệ' })
  roomId?: string;

  @ApiPropertyOptional({
    description: 'Show time start time'
  })
  @IsOptional()
  @IsDate({ message: 'Time start phải là định dạng ngày hợp lệ' })
  timeStart?: Date;

  @ApiPropertyOptional({
    description: 'Show date'
  })
  @IsOptional()
  @IsDate({ message: 'Show date phải là định dạng ngày hợp lệ' })
  showDate?: Date;
}
