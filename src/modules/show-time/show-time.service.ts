import { RESPONSE_MESSAGES } from '@common/constants';
import { IPaginatedResponse } from '@common/types/pagination-base.type';
import PaginationHelper from '@common/utils/pagination.util';
import { SeatService } from '@modules/seat/seat.service';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from '@shared/db/entities/branch.entity';
import { Movie } from '@shared/db/entities/movie.entity';
import { Room } from '@shared/db/entities/room.entity';
import { ShowTime } from '@shared/db/entities/show-time.entity';
import { Repository } from 'typeorm';
import { CreateShowTimeDto } from './dto/create-show-time.dto';
import { ShowTimeGroupedResponseDto } from './dto/show-time-response.dto';
import { UpdateShowTimeDto } from './dto/update-show-time.dto';
import { GetShowtimesQueryDto } from './show-time.controller';

@Injectable()
export class ShowTimeService {
  constructor(
    @InjectRepository(ShowTime)
    private readonly showTimeRepository: Repository<ShowTime>,

    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,

    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,

    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    private readonly seatService: SeatService
  ) {}

  async getShowTimesWithMovie(
    movieId: string
  ): Promise<IPaginatedResponse<ShowTimeGroupedResponseDto>> {
    const now = new Date();
    const bufferMinutes = 15;
    const bufferTime = new Date(now.getTime() + bufferMinutes * 60 * 1000);

    const queryBuilder = this.showTimeRepository
      .createQueryBuilder('showTime')
      .leftJoinAndSelect('showTime.movie', 'movie')
      .leftJoinAndSelect('showTime.room', 'room')
      .leftJoinAndSelect('room.branch', 'branch')
      .where('movie.id = :movieId', { movieId })
      .andWhere('showTime.timeStart >= :bufferTime', { bufferTime })
      .orderBy('showTime.timeStart', 'ASC');

    const items = await queryBuilder.getMany();
    const seatSummaryMap = await this.buildSeatSummaryMap(items);
    const grouped: Record<
      string,
      { name: string; value: Date; times: ShowTimeGroupedResponseDto['times'] }
    > = {};

    for (const item of items) {
      const showDate = new Date(item.showDate ?? item.timeStart);

      const year = showDate.getFullYear();
      const month = String(showDate.getMonth() + 1).padStart(2, '0');
      const day = String(showDate.getDate()).padStart(2, '0');
      const localDayKey = `${year}-${month}-${day}`;

      const weekdayName = showDate.toLocaleDateString('en-US', { weekday: 'long' });
      const timeFormatted = new Date(item.timeStart).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      if (!grouped[localDayKey]) {
        grouped[localDayKey] = {
          name: weekdayName,
          value: showDate,
          times: []
        };
      }

      if (!grouped[localDayKey].times.some((t) => t.id === item.id)) {
        const summary = seatSummaryMap.get(item.id) ?? {
          totalSeats: 0,
          availableSeats: 0,
          occupiedSeats: 0
        };

        grouped[localDayKey].times.push({
          id: item.id,
          time: timeFormatted,
          totalSeats: summary.totalSeats,
          availableSeats: summary.availableSeats,
          occupiedSeats: summary.occupiedSeats
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

  async getShowTimesWithBranch(
    query: GetShowtimesQueryDto
  ): Promise<IPaginatedResponse<ShowTimeGroupedResponseDto>> {
    const now = new Date();
    const bufferMinutes = 15;
    const bufferTime = new Date(now.getTime() + bufferMinutes * 60 * 1000);

    const queryBuilder = this.showTimeRepository
      .createQueryBuilder('showTime')
      .leftJoinAndSelect('showTime.movie', 'movie')
      .leftJoinAndSelect('showTime.room', 'room')
      .leftJoinAndSelect('room.branch', 'branch')
      .where('branch.id = :branchId', { branchId: query.branchId })
      .andWhere('movie.id = :movieId', { movieId: query.movieId })
      .andWhere('showTime.timeStart >= :bufferTime', { bufferTime })
      .orderBy('showTime.timeStart', 'ASC');

    const items = await queryBuilder.getMany();
    const seatSummaryMap = await this.buildSeatSummaryMap(items);
    const grouped: Record<
      string,
      { name: string; value: Date; times: ShowTimeGroupedResponseDto['times'] }
    > = {};

    for (const item of items) {
      const showDate = new Date(item.showDate ?? item.timeStart);

      const year = showDate.getFullYear();
      const month = String(showDate.getMonth() + 1).padStart(2, '0');
      const day = String(showDate.getDate()).padStart(2, '0');
      const localDayKey = `${year}-${month}-${day}`;

      const weekdayName = showDate.toLocaleDateString('en-US', { weekday: 'long' });
      const timeFormatted = new Date(item.timeStart).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      if (!grouped[localDayKey]) {
        grouped[localDayKey] = {
          name: weekdayName,
          value: showDate,
          times: []
        };
      }

      if (!grouped[localDayKey].times.some((t) => t.id === item.id)) {
        const summary = seatSummaryMap.get(item.id) ?? {
          totalSeats: 0,
          availableSeats: 0,
          occupiedSeats: 0
        };

        grouped[localDayKey].times.push({
          id: item.id,
          time: timeFormatted,
          totalSeats: summary.totalSeats,
          availableSeats: summary.availableSeats,
          occupiedSeats: summary.occupiedSeats
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

  private async buildSeatSummaryMap(
    showTimes: ShowTime[]
  ): Promise<Map<string, { totalSeats: number; availableSeats: number; occupiedSeats: number }>> {
    const summaries = await Promise.all(
      showTimes.map(async (item) => ({
        showTimeId: item.id,
        ...(await this.seatService.getSeatSummaryByShowTime(item.id, item.room?.id ?? item.roomId))
      }))
    );

    return new Map(summaries.map((summary) => [summary.showTimeId, summary]));
  }

  async getShowTimeByShowDateAndBranchId(showDate: Date, branchId: string): Promise<ShowTime[]> {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId }
    });

    if (!branch) {
      throw new ConflictException(RESPONSE_MESSAGES.BRANCH_NOT_FOUND);
    }

    // Tạo start và end của ngày để tìm kiếm chính xác theo showDate
    const startOfDay = new Date(showDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(showDate);
    endOfDay.setHours(23, 59, 59, 999);

    const showTimes = await this.showTimeRepository
      .createQueryBuilder('showTime')
      .leftJoinAndSelect('showTime.movie', 'movie')
      .leftJoinAndSelect('showTime.room', 'room')
      .leftJoinAndSelect('room.branch', 'branch')
      .where('branch.id = :branchId', { branchId })
      .andWhere('showTime.showDate >= :startOfDay', { startOfDay })
      .andWhere('showTime.showDate <= :endOfDay', { endOfDay })
      .orderBy('showTime.timeStart', 'ASC')
      .getMany();

    return showTimes;
  }

  async getShowTimeByDateAndRoomId(date: string, roomId: string): Promise<ShowTime[]> {
    // Validate room exists
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['branch']
    });

    if (!room) {
      throw new ConflictException(RESPONSE_MESSAGES.ROOM_NOT_FOUND);
    }

    // Parse date string (YYYY-MM-DD) and create date range
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Query showtimes for the room on the specific date
    const showTimes = await this.showTimeRepository
      .createQueryBuilder('showTime')
      .leftJoinAndSelect('showTime.movie', 'movie')
      .leftJoinAndSelect('showTime.room', 'room')
      .leftJoinAndSelect('room.branch', 'branch')
      .where('room.id = :roomId', { roomId })
      .andWhere('showTime.showDate >= :startOfDay', { startOfDay })
      .andWhere('showTime.showDate <= :endOfDay', { endOfDay })
      .orderBy('showTime.timeStart', 'ASC')
      .getMany();

    return showTimes;
  }

  async getShowTimeByDateAndMovieId(
    date: string,
    movieId: string,
    branchId: string
  ): Promise<ShowTime[]> {
    // Validate movie exists
    const movie = await this.movieRepository.findOne({
      where: { id: movieId }
    });

    if (!movie) {
      throw new ConflictException(RESPONSE_MESSAGES.MOVIE_NOT_FOUND);
    }

    // Validate branch exists
    const branch = await this.branchRepository.findOne({
      where: { id: branchId }
    });

    if (!branch) {
      throw new ConflictException(RESPONSE_MESSAGES.BRANCH_NOT_FOUND);
    }

    // Parse date string (YYYY-MM-DD) and create date range
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Query showtimes for the movie on the specific date and branch
    const showTimes = await this.showTimeRepository
      .createQueryBuilder('showTime')
      .leftJoinAndSelect('showTime.movie', 'movie')
      .leftJoinAndSelect('showTime.room', 'room')
      .leftJoinAndSelect('room.branch', 'branch')
      .where('movie.id = :movieId', { movieId })
      .andWhere('branch.id = :branchId', { branchId })
      .andWhere('showTime.showDate >= :startOfDay', { startOfDay })
      .andWhere('showTime.showDate <= :endOfDay', { endOfDay })
      .orderBy('showTime.timeStart', 'ASC')
      .getMany();

    return showTimes;
  }

  async createShowTime(
    branchIdOfAccount: string,
    createShowTimeDto: CreateShowTimeDto
  ): Promise<ShowTime> {
    // Kiểm tra showDate không được nhỏ hơn ngày hiện tại
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Đặt về đầu ngày để so sánh chính xác

    const inputShowDate = new Date(createShowTimeDto.showDate);
    inputShowDate.setHours(0, 0, 0, 0);

    if (inputShowDate < today) {
      throw new ConflictException(RESPONSE_MESSAGES.SHOW_DATE_CANNOT_BE_IN_PAST);
    }

    const movie = await this.movieRepository.findOne({
      where: { id: createShowTimeDto.movieId }
    });

    if (!movie) {
      throw new ConflictException(RESPONSE_MESSAGES.MOVIE_NOT_FOUND);
    }

    const room = await this.roomRepository.findOne({
      where: { id: createShowTimeDto.roomId },
      relations: ['branch']
    });

    if (!room) {
      throw new ConflictException(RESPONSE_MESSAGES.ROOM_NOT_FOUND);
    }

    if (room.branch.id !== branchIdOfAccount) {
      throw new ConflictException(RESPONSE_MESSAGES.USER_NO_BRANCH_ASSIGNED);
    }

    // Kiểm tra xung đột thời gian với các showtime khác trong cùng phòng
    await this.checkTimeConflict(
      createShowTimeDto.roomId,
      new Date(createShowTimeDto.timeStart),
      movie.duration,
      createShowTimeDto.showDate
    );

    // Tạo mới showtime
    const newShowTime = this.showTimeRepository.create({
      movieId: movie.id,
      roomId: room.id,
      timeStart: createShowTimeDto.timeStart,
      showDate: createShowTimeDto.showDate,
      movie: movie,
      room: room
    });

    const savedShowTime = await this.showTimeRepository.save(newShowTime);

    // Load lại showtime với đầy đủ relations
    const showTimeWithRelations = await this.showTimeRepository.findOne({
      where: { id: savedShowTime.id },
      relations: ['movie', 'room', 'room.branch']
    });

    return showTimeWithRelations;
  }

  async updateShowTime(
    showTimeId: string,
    branchIdOfAccount: string,
    updateData: UpdateShowTimeDto
  ): Promise<ShowTime> {
    // Kiểm tra showtime tồn tại và thuộc về branch của user
    const existingShowTime = await this.showTimeRepository.findOne({
      where: { id: showTimeId },
      relations: ['movie', 'room', 'room.branch']
    });

    if (!existingShowTime) {
      throw new ConflictException(RESPONSE_MESSAGES.NOT_FOUND);
    }

    if (existingShowTime.room.branch.id !== branchIdOfAccount) {
      throw new ConflictException(RESPONSE_MESSAGES.USER_NO_BRANCH_ASSIGNED);
    }

    // Validate showDate nếu có update
    if (updateData.showDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const inputShowDate = new Date(updateData.showDate);
      inputShowDate.setHours(0, 0, 0, 0);

      if (inputShowDate < today) {
        throw new ConflictException(RESPONSE_MESSAGES.SHOW_DATE_CANNOT_BE_IN_PAST);
      }
    }

    // Validate movie nếu có update
    if (updateData.movieId && updateData.movieId !== existingShowTime.movieId) {
      const movie = await this.movieRepository.findOne({
        where: { id: updateData.movieId }
      });

      if (!movie) {
        throw new ConflictException(RESPONSE_MESSAGES.MOVIE_NOT_FOUND);
      }
    }

    // Validate room nếu có update và thuộc branch của user
    if (updateData.roomId && updateData.roomId !== existingShowTime.roomId) {
      const room = await this.roomRepository.findOne({
        where: { id: updateData.roomId },
        relations: ['branch']
      });

      if (!room) {
        throw new ConflictException(RESPONSE_MESSAGES.ROOM_NOT_FOUND);
      }

      if (room.branch.id !== branchIdOfAccount) {
        throw new ConflictException(RESPONSE_MESSAGES.USER_NO_BRANCH_ASSIGNED);
      }
    }

    // Kiểm tra xung đột thời gian nếu có thay đổi timeStart, movieId, roomId, hoặc showDate
    if (updateData.timeStart || updateData.movieId || updateData.roomId || updateData.showDate) {
      const timeStart = updateData.timeStart || existingShowTime.timeStart;
      const movieId = updateData.movieId || existingShowTime.movieId;
      const roomId = updateData.roomId || existingShowTime.roomId;
      const showDate = updateData.showDate || existingShowTime.showDate;

      // Load movie để lấy duration
      const movie = await this.movieRepository.findOne({
        where: { id: movieId }
      });

      if (movie) {
        await this.checkTimeConflict(
          roomId,
          new Date(timeStart),
          movie.duration,
          new Date(showDate),
          showTimeId // Exclude current showtime from conflict check
        );
      }
    }

    // Update showtime
    await this.showTimeRepository.update(showTimeId, {
      ...(updateData.movieId && { movieId: updateData.movieId }),
      ...(updateData.roomId && { roomId: updateData.roomId }),
      ...(updateData.timeStart && { timeStart: updateData.timeStart }),
      ...(updateData.showDate && { showDate: updateData.showDate })
    });

    // Load lại với relations
    const updatedShowTime = await this.showTimeRepository.findOne({
      where: { id: showTimeId },
      relations: ['movie', 'room', 'room.branch']
    });

    if (!updatedShowTime) {
      throw new ConflictException(RESPONSE_MESSAGES.NOT_FOUND);
    }

    return updatedShowTime;
  }

  async deleteShowTime(showTimeId: string, branchIdOfAccount: string): Promise<void> {
    // Kiểm tra showtime tồn tại và thuộc về branch của user
    const existingShowTime = await this.showTimeRepository.findOne({
      where: { id: showTimeId },
      relations: ['room', 'room.branch', 'bookings']
    });

    if (!existingShowTime) {
      throw new ConflictException(RESPONSE_MESSAGES.NOT_FOUND);
    }

    if (existingShowTime.room.branch.id !== branchIdOfAccount) {
      throw new ConflictException(RESPONSE_MESSAGES.USER_NO_BRANCH_ASSIGNED);
    }

    // Kiểm tra xem có booking nào chưa
    if (existingShowTime.bookings && existingShowTime.bookings.length > 0) {
      throw new ConflictException(RESPONSE_MESSAGES.SHOWTIME_HAS_BOOKINGS_CANNOT_DELETE);
    }

    // Xóa showtime
    await this.showTimeRepository.delete(showTimeId);
  }

  private async checkTimeConflict(
    roomId: string,
    timeStart: Date,
    movieDuration: number,
    showDate: Date,
    excludeShowTimeId?: string
  ): Promise<void> {
    // Tính thời gian kết thúc phim + 15 phút buffer
    const bufferMinutes = 15;
    const movieEndTime = new Date(
      timeStart.getTime() + movieDuration * 60000 + bufferMinutes * 60000
    );

    // Tạo khoảng thời gian trong ngày để tìm kiếm
    const startOfDay = new Date(showDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(showDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Tìm tất cả showtime trong cùng phòng và ngày
    const queryBuilder = this.showTimeRepository
      .createQueryBuilder('showTime')
      .leftJoinAndSelect('showTime.movie', 'movie')
      .where('showTime.roomId = :roomId', { roomId })
      .andWhere('showTime.showDate >= :startOfDay', { startOfDay })
      .andWhere('showTime.showDate <= :endOfDay', { endOfDay });

    // Nếu là update, loại trừ showtime hiện tại
    if (excludeShowTimeId) {
      queryBuilder.andWhere('showTime.id != :excludeShowTimeId', { excludeShowTimeId });
    }

    const existingShowTimes = await queryBuilder.getMany();

    // Kiểm tra xung đột với từng showtime
    for (const existingShowTime of existingShowTimes) {
      const existingTimeStart = new Date(existingShowTime.timeStart);
      const existingMovieDuration = existingShowTime.movie.duration;
      const existingEndTime = new Date(
        existingTimeStart.getTime() + existingMovieDuration * 60000 + bufferMinutes * 60000
      );

      // Kiểm tra xung đột:
      // 1. Thời gian bắt đầu mới nằm trong khoảng [existingStart, existingEnd]
      // 2. Thời gian kết thúc mới nằm trong khoảng [existingStart, existingEnd]
      // 3. Showtime mới bao trùm showtime cũ
      const hasConflict =
        (timeStart >= existingTimeStart && timeStart < existingEndTime) ||
        (movieEndTime > existingTimeStart && movieEndTime <= existingEndTime) ||
        (timeStart <= existingTimeStart && movieEndTime >= existingEndTime);

      if (hasConflict) {
        throw new ConflictException(RESPONSE_MESSAGES.SHOWTIME_TIME_CONFLICT);
      }
    }
  }
}
