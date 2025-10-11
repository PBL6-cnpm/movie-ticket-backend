import { Room } from '@shared/db/entities/room.entity';

export class RoomResponseDto {
  id: string;
  branchId: string;
  name: string;

  constructor(room: Room) {
    this.id = room.id;
    this.branchId = room.branchId;
    this.name = room.name;
  }
}
