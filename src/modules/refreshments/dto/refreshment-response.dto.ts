import { Refreshments } from '@shared/db/entities/refreshments.entity';

export class RefreshmentResponseDto {
  id: string;
  name: string;
  picture: string;
  price: number;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(refreshment: Refreshments, detailInfo: boolean = true) {
    this.id = refreshment.id;
    this.name = refreshment.name;
    this.price = refreshment.price;

    if (detailInfo) {
      this.picture = refreshment.picture;
      this.isCurrent = refreshment.isCurrent;
      this.createdAt = refreshment.createdAt;
      this.updatedAt = refreshment.updatedAt;
    }
  }
}
