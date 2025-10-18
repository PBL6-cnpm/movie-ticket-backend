import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class QueryHoldBookingDto {
  @ApiProperty({
    type: String
  })
  @IsUUID()
  showTimeId: string;

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'List of seat IDs to hold'
  })
  @IsUUID('4', { each: true })
  seatIds: string[];
}
