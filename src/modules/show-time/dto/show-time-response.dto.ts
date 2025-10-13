import { ApiProperty } from '@nestjs/swagger';
import { ShowTime } from '@shared/db/entities/show-time.entity';

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

export class ShowTimeResponseDto {
  id: string;
  timeStart: Date;
  showDate: Date;
  room: {
    id: string;
    name: string;
  };
  movie: {
    id: string;
    name: string;
    poster: string;
  };

  constructor(showTime: ShowTime) {
    this.id = showTime.id;
    this.timeStart = showTime.timeStart;
    this.showDate = showTime.showDate;
    this.movie = showTime.movie
      ? {
          id: showTime.movie.id,
          name: showTime.movie.name,
          poster: showTime.movie.poster
        }
      : null;
    this.room = showTime.room
      ? {
          id: showTime.room.id,
          name: showTime.room.name
        }
      : null;
  }
}
