import { TypeSeat } from '@shared/db/entities/type-seat.entity';

export class TypeSeatResponseDto {
  id: string;
  name: string;
  price: number;
  isCurrent: boolean;
  createdAt: Date;

  constructor(typeSeat: TypeSeat) {
    this.id = typeSeat.id;
    this.name = typeSeat.name;
    this.price = typeSeat.price;
    this.isCurrent = typeSeat.isCurrent;
    this.createdAt = typeSeat.createdAt;
  }
}
