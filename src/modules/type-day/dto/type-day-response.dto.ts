import { DayOfWeek } from '@common/enums';
import { TypeDay } from '@shared/db/entities/type-day.entity';

export class TypeDayResponseDto {
  id: string;
  dayOfWeek: DayOfWeek;
  additionalPrice: number;

  constructor(typeDay: TypeDay) {
    this.id = typeDay.id;
    this.dayOfWeek = typeDay.dayOfWeek;
    this.additionalPrice = typeDay.additionalPrice;
  }
}
