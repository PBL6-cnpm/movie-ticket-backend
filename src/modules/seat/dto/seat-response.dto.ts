import { Seat } from '@shared/db/entities/seat.entity';

export class SeatResponseDto {
  id: string;
  name: string;
  typeSeat?: { id: string; name: string };
  room?: { id: string; name: string };

  constructor(seat: Seat) {
    this.id = seat.id;
    this.name = seat.name;
    this.typeSeat = seat.typeSeat
      ? {
          id: seat.typeSeat.id,
          name: seat.typeSeat.name
        }
      : null;
    this.room = seat.room
      ? {
          id: seat.room.id,
          name: seat.room.name
        }
      : null;
  }
}
