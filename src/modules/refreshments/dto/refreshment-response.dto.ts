import { Refreshments } from '@shared/db/entities/refreshments.entity';

export class RefreshmentResponseDto {
  id: string;
  name: string;
  picture: string;
  price: number;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(refreshment: Refreshments) {
    this.id = refreshment.id;
    this.name = refreshment.name;
    this.picture = refreshment.picture;
    this.price = refreshment.price;
    this.isCurrent = refreshment.isCurrent;
    this.createdAt = refreshment.createdAt;
    this.updatedAt = refreshment.updatedAt;
  }
}
