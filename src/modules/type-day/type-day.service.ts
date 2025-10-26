import { BaseService } from '@bases/base-service';
import { RESPONSE_MESSAGES } from '@common/constants';
import { NotFound } from '@common/exceptions';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeDay } from '@shared/db/entities/type-day.entity';
import { Repository } from 'typeorm';
import { UpdateTypeDayDto } from './dto/update-type-day.dto';

@Injectable()
export class TypeDayService extends BaseService<TypeDay> {
  constructor(
    @InjectRepository(TypeDay)
    private readonly typeDayRepo: Repository<TypeDay>
  ) {
    super(typeDayRepo);
  }

  async getAllTypeDay(): Promise<TypeDay[]> {
    return this.typeDayRepo.find({
      where: { isCurrent: true }
    });
  }

  async updateTypeDay(id: string, updateTypeDayDto: UpdateTypeDayDto): Promise<TypeDay> {
    const existingTypeDay = await this.findOne({
      where: { id },
      relations: ['bookSeats']
    });

    if (!existingTypeDay) {
      throw new NotFound(RESPONSE_MESSAGES.TYPE_DAY_NOT_FOUND);
    }

    if (existingTypeDay.bookSeats.length > 0) {
      const resultDuplicate = await this.typeDayRepo
        .createQueryBuilder()
        .update(TypeDay)
        .set({ isCurrent: false })
        .where('day_of_week = :dayOfWeek AND is_current = true', {
          dayOfWeek: String(existingTypeDay.dayOfWeek)
        })
        .execute();

      if (resultDuplicate) {
        await this.create({
          dayOfWeek: existingTypeDay.dayOfWeek,
          additionalPrice: updateTypeDayDto.additionalPrice,
          isCurrent: true
        });
      }
    } else {
      await this.updateById(id, {
        additionalPrice: updateTypeDayDto.additionalPrice
      });
    }

    const updateTypeDay = await this.typeDayRepo.findOne({
      where: { isCurrent: true, dayOfWeek: existingTypeDay.dayOfWeek }
    });

    if (!updateTypeDay) {
      throw new NotFound(RESPONSE_MESSAGES.TYPE_DAY_NOT_FOUND);
    }

    return updateTypeDay;
  }
}
