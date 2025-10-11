import { IPaginatedResponse } from '@common/types/pagination-base.type';
import PaginationHelper from '@common/utils/pagination.util';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ShowTime } from '@shared/db/entities/show-time.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ShowTimeService {
  constructor(
    @InjectRepository(ShowTime)
    private readonly showTimeRepository: Repository<ShowTime>
  ) {}

  async getShowTimesWithMovie(movieId: string): Promise<
    IPaginatedResponse<{
      dayOfWeek: { name: string; value: Date };
      times: { id: string; time: string }[];
    }>
  > {
    const queryBuilder = this.showTimeRepository
      .createQueryBuilder('showTime')
      .leftJoinAndSelect('showTime.movie', 'movie')
      .leftJoinAndSelect('showTime.room', 'room')
      .leftJoinAndSelect('room.branch', 'branch')
      .where('movie.id = :movieId', { movieId })
      .orderBy('showTime.timeStart', 'ASC');

    const items = await queryBuilder.getMany();

    const grouped: Record<
      string,
      { name: string; value: Date; times: { id: string; time: string }[] }
    > = {};

    for (const item of items) {
      const showDate = new Date(item.showDate ?? item.timeStart);
      const dayKey = showDate.toISOString().split('T')[0]; // YYYY-MM-DD

      const weekdayName = showDate.toLocaleDateString('en-US', { weekday: 'long' });
      const timeFormatted = new Date(item.timeStart).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      if (!grouped[dayKey]) {
        grouped[dayKey] = {
          name: weekdayName,
          value: showDate,
          times: []
        };
      }

      if (!grouped[dayKey].times.some((t) => t.time === timeFormatted)) {
        grouped[dayKey].times.push({
          id: item.id,
          time: timeFormatted
        });
      }
    }

    const groupedData = Object.values(grouped).sort(
      (a, b) => a.value.getTime() - b.value.getTime()
    );

    const total = groupedData.length;

    return PaginationHelper.pagination({
      limit: total,
      offset: 0,
      totalItems: total,
      items: groupedData.map((group) => ({
        dayOfWeek: {
          name: group.name,
          value: group.value
        },
        times: group.times
      }))
    });
  }
}
