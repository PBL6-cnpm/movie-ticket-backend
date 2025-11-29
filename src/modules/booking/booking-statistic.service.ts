import { RESPONSE_MESSAGES } from '@common/constants';
import { BookingStatus, TimeGroupBy } from '@common/enums/booking.enum';
import { BadRequest } from '@common/exceptions';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '@shared/db/entities/booking.entity';
import { Repository } from 'typeorm';
import { RevenueByMovie } from './interfaces/revenue-by-movie.interface';
import { RevenueByTimeDto } from './interfaces/revenue-by-time.interface';

@Injectable()
export class BookingStatisticService {
  constructor(@InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>) {}

  async getRevenueByMovie(startDate?: string, endDate?: string): Promise<RevenueByMovie[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (start && isNaN(start.getTime())) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_START_DATE);
    }
    if (end && isNaN(end.getTime())) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_END_DATE_FORMAT);
    }

    const queryBuilder = this.bookingRepo
      .createQueryBuilder('booking')
      .innerJoin('booking.showTime', 'showTime')
      .innerJoin('showTime.movie', 'movie')
      .leftJoin('booking.bookSeats', 'bookSeats')
      .select('movie.id', 'movieId')
      .addSelect('movie.name', 'movieName')
      .addSelect('SUM(booking.totalBookingPrice)', 'totalRevenue')
      .addSelect('COUNT(DISTINCT booking.id)', 'totalBookings')
      .addSelect('COUNT(bookSeats.seatId)', 'totalSeats')
      .where('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .groupBy('movie.id')
      .addGroupBy('movie.name')
      .orderBy('totalRevenue', 'DESC');

    if (startDate) {
      queryBuilder.andWhere('booking.dateTimeBooking >= :startDate', {
        startDate
      });
    }
    if (endDate) {
      queryBuilder.andWhere('booking.dateTimeBooking <= :endDate', { endDate });
    }

    const results = await queryBuilder.getRawMany();

    return results.map((item) => ({
      movieId: item.movieId,
      movieName: item.movieName,
      totalRevenue: parseInt(item.totalRevenue) || 0,
      totalBookings: parseInt(item.totalBookings) || 0,
      totalSeats: parseInt(item.totalSeats) || 0
    }));
  }

  async getRevenueByTime(
    groupBy: TimeGroupBy,
    startDate?: string,
    endDate?: string
  ): Promise<RevenueByTimeDto[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (start && isNaN(start.getTime())) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_START_DATE);
    }
    if (end && isNaN(end.getTime())) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_END_DATE_FORMAT);
    }

    let selectExpression: string;
    let groupByExpression: string;

    switch (groupBy) {
      case TimeGroupBy.DAY:
        selectExpression = "DATE_FORMAT(booking.dateTimeBooking, '%Y-%m-%d')";
        groupByExpression = "DATE_FORMAT(booking.dateTimeBooking, '%Y-%m-%d')";
        break;
      case TimeGroupBy.MONTH:
        selectExpression = "DATE_FORMAT(booking.dateTimeBooking, '%Y-%m')";
        groupByExpression = "DATE_FORMAT(booking.dateTimeBooking, '%Y-%m')";
        break;
      case TimeGroupBy.QUARTER:
        selectExpression =
          "CONCAT('Q', QUARTER(booking.dateTimeBooking), '-', YEAR(booking.dateTimeBooking))";
        groupByExpression =
          "CONCAT('Q', QUARTER(booking.dateTimeBooking), '-', YEAR(booking.dateTimeBooking))";
        break;
      case TimeGroupBy.YEAR:
        selectExpression = "DATE_FORMAT(booking.dateTimeBooking, '%Y')";
        groupByExpression = "DATE_FORMAT(booking.dateTimeBooking, '%Y')";
        break;
      default:
        selectExpression = "DATE_FORMAT(booking.dateTimeBooking, '%Y-%m-%d')";
        groupByExpression = "DATE_FORMAT(booking.dateTimeBooking, '%Y-%m-%d')";
    }

    const queryBuilder = this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoin('booking.bookSeats', 'bookSeats')
      .select(selectExpression, 'period')
      .addSelect('SUM(booking.totalBookingPrice)', 'totalRevenue')
      .addSelect('COUNT(DISTINCT booking.id)', 'totalBookings')
      .addSelect('COUNT(bookSeats.seatId)', 'totalSeats')
      .where('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .groupBy(groupByExpression)
      .orderBy('period', 'ASC');

    if (startDate) {
      queryBuilder.andWhere('booking.dateTimeBooking >= :startDate', {
        startDate
      });
    }
    if (endDate) {
      queryBuilder.andWhere('booking.dateTimeBooking <= :endDate', { endDate });
    }

    const results = await queryBuilder.getRawMany();

    return results.map((item) => ({
      period: item.period,
      totalRevenue: parseInt(item.totalRevenue) || 0,
      totalBookings: parseInt(item.totalBookings) || 0,
      totalSeats: parseInt(item.totalSeats) || 0
    }));
  }
}
