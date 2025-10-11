import { ApiProperty } from '@nestjs/swagger';

export class DayOfWeekResponseDto {
  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Date })
  value: Date;
}

export class ShowTimeGroupedResponseDto {
  @ApiProperty({ type: DayOfWeekResponseDto })
  dayOfWeek: DayOfWeekResponseDto;

  @ApiProperty({
    type: [Object],
    example: [
      { id: '1', time: '10:00 AM' },
      { id: '2', time: '12:30 PM' },
      { id: '3', time: '08:00 PM' }
    ]
  })
  times: { id: string; time: string }[];
}
