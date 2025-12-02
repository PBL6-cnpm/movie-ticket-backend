import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Booking } from '@shared/db/entities/booking.entity';
import { EntityManager } from 'typeorm';

import { PopularMovieResponseDto } from './dto/popular-movie-response.dto';
import { RevenueResponseDto } from './dto/revenue-response.dto';

@Injectable()
export class ReportService {
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

  async getRevenue(
    branchId: string,
    period: 'day' | 'week' | 'month'
  ): Promise<RevenueResponseDto> {
    const query = this.entityManager
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .leftJoin('booking.showTime', 'showTime')
      .leftJoin('showTime.room', 'room')
      .leftJoin('room.branch', 'branch')
      .select('SUM(booking.totalBookingPrice)', 'totalRevenue')
      .addSelect('COUNT(booking.id)', 'totalBookings')
      .where('branch.id = :branchId', { branchId })
      .andWhere('booking.status = :status', { status: 'CONFIRMED' });

    const now = new Date();
    const startDate = new Date();

    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }

    query.andWhere('booking.dateTimeBooking >= :startDate', { startDate });

    const result = await query.getRawOne();
    return new RevenueResponseDto({
      totalRevenue: parseFloat(result.totalRevenue || '0'),
      totalBookings: parseInt(result.totalBookings || '0', 10),
      period
    });
  }

  async getPopularMovies(branchId: string): Promise<PopularMovieResponseDto[]> {
    const result = await this.entityManager
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .leftJoin('booking.showTime', 'showTime')
      .leftJoin('showTime.room', 'room')
      .leftJoin('room.branch', 'branch')
      .leftJoin('showTime.movie', 'movie')
      .select('movie.id', 'movieId')
      .addSelect('movie.name', 'movieName')
      .addSelect('COUNT(booking.id)', 'bookingCount')
      .where('branch.id = :branchId', { branchId })
      .andWhere('booking.status = :status', { status: 'CONFIRMED' })
      .groupBy('movie.id')
      .addGroupBy('movie.name')
      .orderBy('bookingCount', 'DESC')
      .limit(5)
      .getRawMany();

    return result.map(
      (item) =>
        new PopularMovieResponseDto({
          ...item,
          bookingCount: parseInt(item.bookingCount, 10)
        })
    );
  }
}
