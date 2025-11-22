import { RESPONSE_MESSAGES } from '@common/constants';
import { BookingStatus, TimeGroupBy } from '@common/enums/booking.enum';
import { BadRequest } from '@common/exceptions';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '@shared/db/entities/booking.entity';
import { Repository } from 'typeorm';

import { Branch } from '@shared/db/entities/branch.entity';
import { Seat } from '@shared/db/entities/seat.entity';
import {
  MovieRevenueStatsDto,
  RevenueGroupItemDto,
  RevenueStatsQueryDto,
  SingleBranchRevenueDto
} from './dto/revenue-statistic.dto';
import { RevenueByMovie } from './interfaces/revenue-by-movie.interface';
import { RevenueByTimeDto } from './interfaces/revenue-by-time.interface';

@Injectable()
export class BookingStatisticService {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Seat) private readonly seatRepo: Repository<Seat>,
    @InjectRepository(Branch) private readonly branchRepo: Repository<Branch>
  ) {}

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

  async getBranchRevenueStatsByTime(query: RevenueStatsQueryDto): Promise<SingleBranchRevenueDto> {
    const { startDate, endDate, branchId, timePeriod } = query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const branch = await this.branchRepo.findOne({
      where: { id: branchId },
      select: ['id', 'name', 'address']
    });

    const bookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.showTime', 'showTime')
      .leftJoinAndSelect('showTime.room', 'room')
      .leftJoinAndSelect('room.branch', 'branch')
      .leftJoinAndSelect('booking.bookSeats', 'bookSeats')
      .leftJoinAndSelect('booking.bookRefreshmentss', 'bookRefreshmentss')
      .leftJoinAndSelect('bookRefreshmentss.refreshments', 'refreshments')
      .where('booking.dateTimeBooking BETWEEN :start AND :end', { start, end })
      .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .andWhere('branch.id = :branchId', { branchId })
      .getMany();

    if (bookings.length === 0) {
      return {
        branchId: branch.id,
        branchName: branch.name,
        branchAddress: branch.address,
        totalRevenue: 0,
        totalBookings: 0,
        totalTicketsSold: 0,
        totalRefreshmentsRevenue: 0,
        averageTicketPrice: 0,
        revenueByPeriod: timePeriod ? [] : undefined,
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        }
      };
    }

    const periodStatsMap = new Map<string, any>();

    let totalRevenue = 0;
    let totalTicketsSold = 0;
    let totalRefreshmentsRevenue = 0;

    for (const booking of bookings) {
      const ticketRevenue = booking.bookSeats.reduce(
        (sum, bookSeat) => sum + bookSeat.totalSeatPrice,
        0
      );
      const refreshmentRevenue = booking.bookRefreshmentss.reduce(
        (sum, bookRef) => sum + bookRef.quantity * bookRef.refreshments.price,
        0
      );

      totalRevenue += ticketRevenue + refreshmentRevenue;
      totalTicketsSold += booking.bookSeats.length;
      totalRefreshmentsRevenue += refreshmentRevenue;

      // Update period stats if timePeriod is specified
      if (timePeriod) {
        const periodKey = this.getPeriodKey(new Date(booking.dateTimeBooking), timePeriod);
        const periodStats =
          periodStatsMap.get(periodKey) ??
          periodStatsMap
            .set(periodKey, {
              period: periodKey,
              revenue: 0,
              ticketsSold: 0,
              refreshmentsRevenue: 0
            })
            .get(periodKey);

        periodStats.revenue += ticketRevenue + refreshmentRevenue;
        periodStats.ticketsSold += booking.bookSeats.length;
        periodStats.refreshmentsRevenue += refreshmentRevenue;
      }
    }

    const revenueByPeriod =
      timePeriod && periodStatsMap.size > 0
        ? Array.from(periodStatsMap.values())
            .map(
              (item: any): RevenueGroupItemDto => ({
                period: item.period,
                revenue: item.revenue,
                ticketsSold: item.ticketsSold,
                refreshmentsRevenue: item.refreshmentsRevenue
              })
            )
            .sort((a, b) => a.period.localeCompare(b.period))
        : undefined;

    return {
      branchId: branch.id,
      branchName: branch.name,
      branchAddress: branch.address,
      totalRevenue,
      totalBookings: bookings.length,
      totalTicketsSold,
      totalRefreshmentsRevenue,
      averageTicketPrice:
        totalTicketsSold > 0 ? (totalRevenue - totalRefreshmentsRevenue) / totalTicketsSold : 0,
      revenueByPeriod,
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      }
    };
  }

  private getPeriodKey(date: Date, timePeriod: TimeGroupBy): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    switch (timePeriod) {
      case TimeGroupBy.DAY:
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      case TimeGroupBy.MONTH:
        return `${year}-${month.toString().padStart(2, '0')}`;
      case TimeGroupBy.QUARTER: {
        const quarter = Math.ceil(month / 3);
        return `${year}-Q${quarter}`;
      }
      case TimeGroupBy.YEAR:
        return year.toString();
      default:
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }

  async getBranchRevenueStatsByMovie(query: RevenueStatsQueryDto): Promise<SingleBranchRevenueDto> {
    const { startDate, endDate, branchId } = query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const branch = await this.branchRepo.findOne({
      where: { id: branchId },
      select: ['id', 'name', 'address']
    });

    const bookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.showTime', 'showTime')
      .leftJoinAndSelect('showTime.movie', 'movie')
      .leftJoinAndSelect('showTime.room', 'room')
      .leftJoinAndSelect('room.branch', 'branch')
      .leftJoinAndSelect('booking.bookSeats', 'bookSeats')
      .leftJoinAndSelect('booking.bookRefreshmentss', 'bookRefreshmentss')
      .leftJoinAndSelect('bookRefreshmentss.refreshments', 'refreshments')
      .where('booking.dateTimeBooking BETWEEN :start AND :end', { start, end })
      .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .andWhere('branch.id = :branchId', { branchId })
      .andWhere('showTime.time_start BETWEEN :start AND :end', { start, end })
      .getMany();

    if (bookings.length === 0) {
      return {
        branchId: branch.id,
        branchName: branch.name,
        branchAddress: branch.address,
        totalRevenue: 0,
        totalBookings: 0,
        totalTicketsSold: 0,
        totalRefreshmentsRevenue: 0,
        averageTicketPrice: 0,
        movieStats: [],
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        }
      };
    }

    const movieStatsMap = new Map<string, any>();
    const movieRoomIdsMap = new Map<string, Set<string>>();

    let totalRevenue = 0;
    let totalTicketsSold = 0;
    let totalRefreshmentsRevenue = 0;

    for (const booking of bookings) {
      const movie = booking.showTime.movie;
      const movieKey = movie.id;
      const roomId = booking.showTime.room.id;

      const movieStats =
        movieStatsMap.get(movieKey) ??
        movieStatsMap
          .set(movieKey, {
            movieId: movie.id,
            movieName: movie.name,
            totalRevenue: 0,
            totalBookings: 0,
            totalSeats: 0,
            occupancyRate: 0
          })
          .get(movieKey);

      if (!movieRoomIdsMap.has(movieKey)) {
        movieRoomIdsMap.set(movieKey, new Set());
      }
      movieRoomIdsMap.get(movieKey).add(roomId);

      // Calculate revenue
      const ticketRevenue = booking.bookSeats.reduce(
        (sum, bookSeat) => sum + bookSeat.totalSeatPrice,
        0
      );
      const refreshmentRevenue = booking.bookRefreshmentss.reduce(
        (sum, bookRef) => sum + bookRef.quantity * bookRef.refreshments.price,
        0
      );

      // Update movie stats
      movieStats.totalRevenue += ticketRevenue + refreshmentRevenue;
      movieStats.totalBookings += 1;
      movieStats.totalSeats += booking.bookSeats.length;

      // Update branch totals
      totalRevenue += ticketRevenue + refreshmentRevenue;
      totalTicketsSold += booking.bookSeats.length;
      totalRefreshmentsRevenue += refreshmentRevenue;
    }

    // Get room capacities
    const allRoomIds = Array.from(new Set(bookings.map((b) => b.showTime.room.id)));

    const seatsByRoom = await this.seatRepo
      .createQueryBuilder('seat')
      .select('seat.room_id', 'room_id')
      .addSelect('COUNT(seat.seat_id)', 'totalSeats')
      .where('seat.room_id IN (:...roomIds)', { roomIds: allRoomIds })
      .groupBy('seat.room_id')
      .getRawMany();

    const roomCapacityMap = new Map<string, number>();
    seatsByRoom.forEach((r) => roomCapacityMap.set(r.room_id, Number(r.totalSeats)));

    // Step 4: Calculate occupancy for each movie
    // Count number of shows per movie to calculate total capacity (capacity * num_shows)
    const movieShowCountMap = new Map<string, Map<string, number>>(); // movieId => Map<roomId, showCount>

    for (const booking of bookings) {
      const movieId = booking.showTime.movie.id;
      const roomId = booking.showTime.room.id;
      const showTimeId = booking.showTime.id;

      if (!movieShowCountMap.has(movieId)) {
        movieShowCountMap.set(movieId, new Map());
      }

      const roomShowMap = movieShowCountMap.get(movieId);
      // Track unique show times per room
      if (!roomShowMap.has(showTimeId)) {
        const currentCount = roomShowMap.get(roomId) || 0;
        roomShowMap.set(roomId, currentCount);
        roomShowMap.set(showTimeId, 1); // mark this showtime as counted
      }
    }

    const movieRoomShowsMap = new Map<string, Map<string, Set<string>>>();
    for (const booking of bookings) {
      const movieId = booking.showTime.movie.id;
      const roomId = booking.showTime.room.id;
      const showTimeId = booking.showTime.id;

      if (!movieRoomShowsMap.has(movieId)) {
        movieRoomShowsMap.set(movieId, new Map());
      }
      if (!movieRoomShowsMap.get(movieId).has(roomId)) {
        movieRoomShowsMap.get(movieId).set(roomId, new Set());
      }
      movieRoomShowsMap.get(movieId).get(roomId).add(showTimeId);
    }

    movieStatsMap.forEach((movieStat, movieId) => {
      const roomShowsMap = movieRoomShowsMap.get(movieId);
      let totalCapacity = 0;

      if (roomShowsMap) {
        roomShowsMap.forEach((showTimeIds, roomId) => {
          const roomCapacity = roomCapacityMap.get(roomId) || 0;
          const numShows = showTimeIds.size;
          totalCapacity += roomCapacity * numShows;
        });
      }

      movieStat.occupancyRate =
        totalCapacity > 0 ? +((movieStat.totalSeats / totalCapacity) * 100).toFixed(2) : 0;
    });

    // Step 5: Convert to array and sort
    const movieStats: MovieRevenueStatsDto[] = Array.from(movieStatsMap.values())
      .map(
        (movie: any): MovieRevenueStatsDto => ({
          movieId: movie.movieId,
          movieName: movie.movieName,
          totalRevenue: movie.totalRevenue,
          totalBookings: movie.totalBookings,
          totalSeats: movie.totalSeats,
          occupancyRate: movie.occupancyRate
        })
      )
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      branchId: branch.id,
      branchName: branch.name,
      branchAddress: branch.address,
      totalRevenue,
      totalBookings: bookings.length,
      totalTicketsSold,
      totalRefreshmentsRevenue,
      averageTicketPrice:
        totalTicketsSold > 0 ? (totalRevenue - totalRefreshmentsRevenue) / totalTicketsSold : 0,
      movieStats,
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      }
    };
  }
}
