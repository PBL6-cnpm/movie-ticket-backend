import { ApiProperty } from '@nestjs/swagger';

export class TypeSeatInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  color?: string;
}
export class SeatInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: () => TypeSeatInfo })
  type: TypeSeatInfo;
}
export class SeatByRoomResponseDto {
  @ApiProperty()
  roomId: string;

  @ApiProperty()
  roomName: string;

  @ApiProperty()
  seatLayout: {
    rows: string[];
    cols: number;
    occupiedSeats: { id: string; name: string }[];
    seats: SeatInfoDto[];
  };

  @ApiProperty()
  totalSeats: number;

  @ApiProperty()
  availableSeats: number;

  @ApiProperty()
  occupiedSeats: number;

  @ApiProperty({ type: [TypeSeatInfo] })
  typeSeatList: TypeSeatInfo[];
}
