import { SpecialDate } from '@shared/db/entities/special-day.entity';

export class SpecialDateResponseDto {
  id: string;
  date: Date;
  additionalPrice: number;

  constructor(specialDate: SpecialDate) {
    this.id = specialDate.id;
    this.date = specialDate.date;
    this.additionalPrice = specialDate.additionalPrice;
  }
}
