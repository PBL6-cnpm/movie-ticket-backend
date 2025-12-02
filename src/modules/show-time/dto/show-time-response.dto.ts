import { ApiProperty } from '@nestjs/swagger';
import { ShowTime } from '@shared/db/entities/show-time.entity';

export class DayOfWeekResponseDto {
  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Date })
  value: Date;
}

export class ShowTimeSlotResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  time: string;

  @ApiProperty()
  totalSeats: number;

  @ApiProperty()
  availableSeats: number;

  @ApiProperty()
  occupiedSeats: number;

  @ApiProperty()
  roomId: string;

  @ApiProperty()
  roomName: string;
}

export class ShowTimeGroupedResponseDto {
  @ApiProperty({ type: DayOfWeekResponseDto })
  dayOfWeek: DayOfWeekResponseDto;

  @ApiProperty({ type: () => [ShowTimeSlotResponseDto] })
  times: ShowTimeSlotResponseDto[];
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

  totalSeats?: number;
  availableSeats?: number;
  occupiedSeats?: number;

  constructor(
    showTime: ShowTime,
    roomInfo: boolean = true,
    seatStats?: { totalSeats: number; availableSeats: number; occupiedSeats: number }
  ) {
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
    if (roomInfo) {
      this.room = showTime.room
        ? {
            id: showTime.room.id,
            name: showTime.room.name
          }
        : null;
    }
    if (seatStats) {
      this.totalSeats = seatStats.totalSeats;
      this.availableSeats = seatStats.availableSeats;
      this.occupiedSeats = seatStats.occupiedSeats;
    }
  }
}
