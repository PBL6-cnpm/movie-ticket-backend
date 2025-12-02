import { BaseService } from '@bases/base-service';
import { RESPONSE_MESSAGES } from '@common/constants';
import { NotFound } from '@common/exceptions';
import { IPaginatedResponse, PaginationDto } from '@common/types/pagination-base.type';
import PaginationHelper from '@common/utils/pagination.util';
import { BranchMovieShowTimeResponseDto } from '@modules/branch/dto/branch-movie-showtime-response.dto';
import { SeatService } from '@modules/seat/seat.service';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from '@shared/db/entities/branch.entity';
import { Movie } from '@shared/db/entities/movie.entity';
import { ShowTime } from '@shared/db/entities/show-time.entity';
import { In, Repository } from 'typeorm';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchService extends BaseService<Branch> {
  private readonly logger = new Logger(BranchService.name);

  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(ShowTime)
    private readonly showTimeRepo: Repository<ShowTime>,
    @InjectRepository(Movie)
    private readonly movieRepo: Repository<Movie>,
    private readonly seatService: SeatService
  ) {
    super(branchRepo);
  }
  async getAllBranchesWithMovies(movieId: string): Promise<Branch[]> {
    const now = new Date();
    const bufferMinutes = 15;
    const bufferTime = new Date(now.getTime() + bufferMinutes * 60 * 1000);

    return this.branchRepo
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.rooms', 'room')
      .innerJoinAndSelect(
        'room.showTimes',
        'showTime',
        'showTime.movieId = :movieId AND showTime.timeStart >= :bufferTime',
        {
          movieId,
          bufferTime
        }
      )
      .distinct(true)
      .getMany();
  }

  async getMoviesWithShowTimes(
    branchId: string,
    paginationDto?: PaginationDto
  ): Promise<IPaginatedResponse<BranchMovieShowTimeResponseDto>> {
    const limit = paginationDto?.limit ?? 10;
    const offset = paginationDto?.offset ?? 0;

    const branch = await this.branchRepo.findOne({ where: { id: branchId } });

    if (!branch) {
      throw new NotFound(RESPONSE_MESSAGES.BRANCH_NOT_FOUND);
    }

    const now = new Date();
    const bufferMinutes = 15;
    const bufferTime = new Date(now.getTime() + bufferMinutes * 60 * 1000);

    const showTimes = await this.showTimeRepo
      .createQueryBuilder('showTime')
      .leftJoinAndSelect('showTime.movie', 'movie')
      .leftJoinAndSelect('showTime.room', 'room')
      .leftJoin('room.branch', 'branch')
      .where('branch.id = :branchId', { branchId })
      .andWhere('showTime.timeStart >= :bufferTime', { bufferTime })
      .orderBy('movie.id', 'ASC')
      .addOrderBy('showTime.timeStart', 'ASC')
      .getMany();

    if (!showTimes.length) {
      return PaginationHelper.pagination({
        limit,
        offset,
        totalItems: 0,
        items: []
      });
    }

    const movieIds = Array.from(new Set(showTimes.map((showTime) => showTime.movieId)));

    const movies = await this.movieRepo.find({
      where: { id: In(movieIds) },
      relations: ['movieGenres', 'movieGenres.genre', 'movieActors', 'movieActors.actor']
    });

    const movieMap = new Map(movies.map((movie) => [movie.id, movie]));

    const seatSummaries = await Promise.all(
      showTimes.map(async (showTime) => ({
        showTimeId: showTime.id,
        summary: await this.seatService.getSeatSummaryByShowTime(showTime.id, showTime.roomId)
      }))
    );

    const seatSummaryMap = new Map(
      seatSummaries.map(({ showTimeId, summary }) => [showTimeId, summary])
    );

    type DayEntry = {
      name: string;
      value: Date;
      times: Array<{
        id: string;
        time: string;
        totalSeats: number;
        availableSeats: number;
        occupiedSeats: number;
        roomId: string;
        roomName: string;
        sortValue: number;
      }>;
    };

    const groupedByMovie = new Map<string, { movie: Movie; days: Map<string, DayEntry> }>();

    for (const showTime of showTimes) {
      const movie = movieMap.get(showTime.movieId) ?? showTime.movie;

      if (!movie) {
        continue;
      }

      let movieEntry = groupedByMovie.get(movie.id);

      if (!movieEntry) {
        movieEntry = {
          movie,
          days: new Map()
        };
        groupedByMovie.set(movie.id, movieEntry);
      }

      const showDate = new Date(showTime.showDate ?? showTime.timeStart);

      const year = showDate.getFullYear();
      const month = String(showDate.getMonth() + 1).padStart(2, '0');
      const day = String(showDate.getDate()).padStart(2, '0');
      const dayKey = `${year}-${month}-${day}`;

      const weekdayName = showDate.toLocaleDateString('en-US', { weekday: 'long' });

      let dayEntry = movieEntry.days.get(dayKey);

      if (!dayEntry) {
        dayEntry = {
          name: weekdayName,
          value: showDate,
          times: []
        };
        movieEntry.days.set(dayKey, dayEntry);
      }

      if (dayEntry.times.some((time) => time.id === showTime.id)) {
        continue;
      }

      const timeFormatted = new Date(showTime.timeStart).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const seatSummary =
        seatSummaryMap.get(showTime.id) ??
        ({ totalSeats: 0, availableSeats: 0, occupiedSeats: 0 } as const);

      dayEntry.times.push({
        id: showTime.id,
        time: timeFormatted,
        totalSeats: seatSummary.totalSeats,
        availableSeats: seatSummary.availableSeats,
        occupiedSeats: seatSummary.occupiedSeats,
        roomId: showTime.room?.id,
        roomName: showTime.room?.name,
        sortValue: new Date(showTime.timeStart).getTime()
      });
    }

    const responses = Array.from(groupedByMovie.values())
      .map(({ movie, days }) => {
        const groupedDays = Array.from(days.values())
          .sort((a, b) => a.value.getTime() - b.value.getTime())
          .map((day) => ({
            dayOfWeek: {
              name: day.name,
              value: day.value
            },
            times: day.times
              .sort((a, b) => a.sortValue - b.sortValue)
              .map((time) => ({
                id: time.id,
                time: time.time,
                totalSeats: time.totalSeats,
                availableSeats: time.availableSeats,
                occupiedSeats: time.occupiedSeats,
                roomId: time.roomId,
                roomName: time.roomName
              }))
          }));

        return new BranchMovieShowTimeResponseDto(movie, groupedDays);
      })
      .sort((a, b) => {
        const aStart = a.movie.screeningStart?.getTime() ?? 0;
        const bStart = b.movie.screeningStart?.getTime() ?? 0;

        if (aStart !== bStart) {
          return aStart - bStart;
        }

        return a.movie.name.localeCompare(b.movie.name);
      });

    const totalItems = responses.length;
    const paginatedItems = responses.slice(offset, offset + limit);

    return PaginationHelper.pagination({
      limit,
      offset,
      totalItems,
      items: paginatedItems
    });
  }
  async createNewBranch(createBranchDto: CreateBranchDto): Promise<Branch> {
    // Check if branch with same name and address already exists
    const exists = await this.branchRepo.findOne({
      where: {
        name: createBranchDto.name,
        address: createBranchDto.address
      }
    });

    if (exists) {
      throw new ConflictException('Branch with this name and address already exists');
    }

    const branch = this.branchRepo.create(createBranchDto);
    return this.branchRepo.save(branch);
  }

  async getAllBranches(hasShowtimes?: boolean): Promise<Branch[]> {
    if (!hasShowtimes) {
      return this.findAll();
    }

    const now = new Date();
    return this.branchRepo
      .createQueryBuilder('branch')
      .innerJoin('branch.rooms', 'room')
      .innerJoin('room.showTimes', 'showTime')
      .where('showTime.timeStart >= :now', { now })
      .distinct(true)
      .getMany();
  }

  async getBranchById(id: string): Promise<Branch> {
    const branch = await this.findOneById(id);

    if (!branch) {
      throw new NotFound(RESPONSE_MESSAGES.BRANCH_NOT_FOUND);
    }

    return branch;
  }

  async updateBranch(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    const existingBranch = await this.findOneById(id);

    if (!existingBranch) {
      throw new NotFound(RESPONSE_MESSAGES.BRANCH_NOT_FOUND);
    }

    // Check if another branch with same name and address exists (excluding current branch)
    if (updateBranchDto.name || updateBranchDto.address) {
      const checkExisting = await this.branchRepo.findOne({
        where: {
          name: updateBranchDto.name || existingBranch.name,
          address: updateBranchDto.address || existingBranch.address
        }
      });

      if (checkExisting && checkExisting.id !== id) {
        throw new ConflictException('Branch with this name and address already exists');
      }
    }

    await this.updateById(id, updateBranchDto);

    const updatedBranch = await this.findOneById(id);

    if (!updatedBranch) {
      throw new NotFound(RESPONSE_MESSAGES.BRANCH_NOT_FOUND);
    }

    return updatedBranch;
  }

  async deleteBranch(id: string): Promise<void> {
    const branch = await this.findOneById(id);

    if (!branch) {
      throw new NotFound(RESPONSE_MESSAGES.BRANCH_NOT_FOUND);
    }

    // Check if branch has associated accounts or rooms
    if (branch.accounts && branch.accounts.length > 0) {
      throw new ConflictException('Cannot delete branch with associated accounts');
    }

    if (branch.rooms && branch.rooms.length > 0) {
      throw new ConflictException('Cannot delete branch with associated rooms');
    }

    await this.deleteById(id);
  }

  async searchBranches(searchTerm: string): Promise<Branch[]> {
    return this.branchRepo
      .createQueryBuilder('branch')
      .where('branch.name LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('branch.address LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .getMany();
  }
}
