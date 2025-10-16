import { RESPONSE_MESSAGES } from '@common/constants';
import { BadRequest } from '@common/exceptions/bad-request.exception';
import { IPaginatedResponse, PaginationDto } from '@common/types/pagination-base.type';
import PaginationHelper from '@common/utils/pagination.util';
import { ActorResponseDto } from '@modules/actors/dto/actor-response.dto';
import { ReviewResponseDto } from '@modules/reviews/dto/review-response.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor } from '@shared/db/entities/actor.entity';
import { Branch } from '@shared/db/entities/branch.entity';
import { Genre } from '@shared/db/entities/genre.entity';
import { MovieActor } from '@shared/db/entities/movie-actor.entity';
import { MovieGenre } from '@shared/db/entities/movie-genre.entity';
import { Movie } from '@shared/db/entities/movie.entity';
import { Brackets, MoreThan, Repository } from 'typeorm';
import { CloudinaryService } from '../../shared/modules/cloudinary/cloudinary.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { MovieResponseDto } from './dto/movie-response.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Injectable()
export class MovieService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(Movie)
    private readonly movieRepo: Repository<Movie>,
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
    @InjectRepository(Actor)
    private readonly actorRepo: Repository<Actor>,
    @InjectRepository(MovieActor)
    private readonly movieActorRepo: Repository<MovieActor>,
    @InjectRepository(MovieGenre)
    private readonly movieGenreRepo: Repository<MovieGenre>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>
  ) {}

  parseDate = (value: unknown): Date | undefined => {
    if (value === null || value === undefined || value === '') return undefined;

    if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;

    if (typeof value === 'string') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? undefined : d; // thêm check an toàn
    }

    return undefined;
  };

  async createMovie(
    createRequest: CreateMovieDto,
    poster?: Express.Multer.File
  ): Promise<MovieResponseDto> {
    const existingMovie = await this.movieRepo.findOne({ where: { name: createRequest.name } });
    if (existingMovie) {
      throw new BadRequest(RESPONSE_MESSAGES.MOVIE_NAME_EXISTS);
    }

    let cloudUrl = '';

    if (poster) {
      cloudUrl = await this.cloudinaryService.uploadFileBuffer(poster);
    } else {
      throw new Error('Poster file is required');
    }

    const screeningStart = this.parseDate(createRequest.screeningStart);
    const screeningEnd = this.parseDate(createRequest.screeningEnd);

    if (screeningStart && screeningEnd && screeningEnd < screeningStart) {
      throw new BadRequest(RESPONSE_MESSAGES.MOVIE_INVALID_SCREENING_DATES);
    }

    const movie = this.movieRepo.create({
      ...createRequest,
      screeningStart,
      screeningEnd,
      poster: cloudUrl
    });
    await this.movieRepo.save(movie);

    if (createRequest.genre && createRequest.genre.length > 0) {
      for (const genreName of createRequest.genre) {
        let genre = await this.genreRepo.findOne({ where: { name: genreName } });
        if (!genre) {
          genre = this.genreRepo.create({ name: genreName });
          await this.genreRepo.save(genre);
        }

        const movieGenre = this.movieGenreRepo.create({
          movieId: movie.id,
          genreId: genre.id
        });
        await this.movieGenreRepo.save(movieGenre);
      }
    }

    if (createRequest.actors && createRequest.actors.length > 0) {
      for (const actorName of createRequest.actors) {
        let actor = await this.actorRepo.findOne({ where: { name: actorName } });
        if (!actor) {
          actor = this.actorRepo.create({
            name: actorName,
            description: '',
            picture: ''
          });
          await this.actorRepo.save(actor);
        }

        const movieActor = this.movieActorRepo.create({
          movieId: movie.id,
          actorId: actor.id
        });
        await this.movieActorRepo.save(movieActor);
      }
    }

    const savedMovie = await this.movieRepo.findOne({
      where: { id: movie.id },
      relations: ['movieGenres', 'movieGenres.genre', 'movieActors', 'movieActors.actor']
    });

    return new MovieResponseDto(savedMovie);
  }

  async getMovieById(id: string): Promise<MovieResponseDto> {
    const movie = await this.movieRepo.findOne({
      where: { id },
      relations: [
        'movieGenres',
        'movieGenres.genre',
        'movieActors',
        'movieActors.actor',
        'reviews',
        'reviews.account'
      ]
    });

    if (!movie) {
      throw new BadRequest(RESPONSE_MESSAGES.MOVIE_NOT_FOUND);
    }

    const dto = new MovieResponseDto(movie);

    // dto.reviews = movie.reviews ? movie.reviews.map((r) => new ReviewResponseDto(r)) : [];
    dto.reviews = movie.reviews
      ? movie.reviews
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()) // DESC
          .map((r) => new ReviewResponseDto(r))
      : [];

    return dto;
  }

  async updateMovie(
    id: string,
    updateDto: UpdateMovieDto,
    poster?: Express.Multer.File
  ): Promise<MovieResponseDto> {
    const movie = await this.movieRepo.findOne({ where: { id } });
    if (!movie) throw new BadRequest(RESPONSE_MESSAGES.MOVIE_NOT_FOUND);

    // Kiểm tra trùng tên khi đổi
    if (updateDto.name && updateDto.name !== movie.name) {
      const duplicate = await this.movieRepo.findOne({ where: { name: updateDto.name } });
      if (duplicate) {
        throw new BadRequest(RESPONSE_MESSAGES.MOVIE_NAME_EXISTS);
      }
    }

    let cloudUrl = movie.poster;
    if (poster) {
      const oldposter = cloudUrl;
      cloudUrl = await this.cloudinaryService.uploadFileBuffer(poster);

      this.cloudinaryService
        .deleteFileByUrl(oldposter)
        .catch((err) => console.warn('Failed to delete old image:', err.message || err));
    }

    const preparedDto: Partial<Movie> = {
      ...updateDto,
      screeningStart:
        updateDto.screeningStart === undefined
          ? null
          : (this.parseDate(updateDto.screeningStart) ?? null),
      screeningEnd:
        updateDto.screeningEnd === undefined
          ? null
          : (this.parseDate(updateDto.screeningEnd) ?? null),
      poster: cloudUrl
    };

    if (preparedDto.screeningStart && preparedDto.screeningEnd) {
      if (preparedDto.screeningEnd < preparedDto.screeningStart) {
        throw new BadRequest(RESPONSE_MESSAGES.MOVIE_INVALID_SCREENING_DATES);
      }
    }
    Object.assign(movie, preparedDto);

    await this.movieRepo.save(movie);

    if (updateDto.genre) {
      await this.movieGenreRepo.delete({ movieId: movie.id });
      for (const genreName of updateDto.genre) {
        let genre = await this.genreRepo.findOne({ where: { name: genreName } });
        if (!genre) {
          genre = this.genreRepo.create({ name: genreName });
          await this.genreRepo.save(genre);
        }
        await this.movieGenreRepo.save(
          this.movieGenreRepo.create({ movieId: movie.id, genreId: genre.id })
        );
      }
    }

    if (updateDto.actors) {
      await this.movieActorRepo.delete({ movieId: movie.id });
      for (const actorName of updateDto.actors) {
        let actor = await this.actorRepo.findOne({ where: { name: actorName } });
        if (!actor) {
          actor = this.actorRepo.create({ name: actorName, description: '', picture: '' });
          await this.actorRepo.save(actor);
        }
        await this.movieActorRepo.save(
          this.movieActorRepo.create({ movieId: movie.id, actorId: actor.id })
        );
      }
    }

    const updatedMovie = await this.movieRepo.findOne({
      where: { id: movie.id },
      relations: ['movieGenres', 'movieGenres.genre', 'movieActors', 'movieActors.actor']
    });

    return new MovieResponseDto(updatedMovie);
  }

  async searchByName(
    name: string,
    dto: PaginationDto
  ): Promise<{
    movies: MovieResponseDto[];
    actors: ActorResponseDto[];
    totalMovies: number;
    totalActors: number;
  }> {
    const { limit, offset } = dto;

    // Query phim
    const [movies, totalMovies] = await this.movieRepo
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.movieGenres', 'movieGenre')
      .leftJoinAndSelect('movieGenre.genre', 'genre')
      .where('movie.name COLLATE utf8mb4_unicode_ci LIKE :name', { name: `%${name}%` })
      .orderBy('movie.releaseDate', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Query diễn viên
    const [actors, totalActors] = await this.actorRepo
      .createQueryBuilder('actor')
      .where('actor.name COLLATE utf8mb4_unicode_ci LIKE :name', { name: `%${name}%` })
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      movies: movies.map((m) => new MovieResponseDto(m)),
      actors: actors.map((a) => new ActorResponseDto(a)),
      totalMovies,
      totalActors
    };
  }

  async getAllGenres(): Promise<{ id: string; name: string }[]> {
    const genres = await this.genreRepo.find({ order: { name: 'ASC' } });
    return genres.map((g) => ({ id: g.id, name: g.name }));
  }

  async filterMoviesByGenre(
    genres: string[] = [],
    dto: PaginationDto
  ): Promise<{ items: MovieResponseDto[]; total: number }> {
    const { limit, offset } = dto;
    let query = this.movieRepo
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.movieGenres', 'movieGenre')
      .leftJoinAndSelect('movieGenre.genre', 'genre')
      .leftJoinAndSelect('movie.movieActors', 'movieActor')
      .leftJoinAndSelect('movieActor.actor', 'actor');

    if (genres && genres.length > 0) {
      query = query.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('mg.movieId')
          .from('movie_genre', 'mg')
          .innerJoin('genre', 'g', 'g.id = mg.genreId')
          .where('g.name IN (:...genres)', { genres })
          .getQuery();
        return 'movie.id IN ' + subQuery;
      });
    }

    query = query.orderBy('movie.releaseDate', 'DESC').skip(offset).take(limit);

    const [movies, total] = await query.getManyAndCount();
    const items = movies.map((m) => new MovieResponseDto(m));
    return { items, total };
  }

  async getList(dto: PaginationDto): Promise<{ items: MovieResponseDto[]; total: number }> {
    const { limit, offset } = dto;

    const [movies, total] = await this.movieRepo.findAndCount({
      skip: offset,
      take: limit,
      relations: [
        'movieGenres',
        'movieGenres.genre',
        'movieActors',
        'movieActors.actor',
        'reviews',
        'reviews.account'
      ],
      order: { releaseDate: 'DESC' }
    });

    const items = movies.map((m) => {
      const dto = new MovieResponseDto(m);
      delete (dto as any).reviews; // remove reviews from returned DTO
      return dto;
    });
    return { items, total };
  }

  async getUpcomingMovies(
    dto: PaginationDto
  ): Promise<{ items: MovieResponseDto[]; total: number }> {
    const { limit, offset } = dto;
    const now = new Date();

    const [movies, total] = await this.movieRepo.findAndCount({
      where: {
        screeningStart: MoreThan(now) // > now
      },
      relations: ['movieGenres.genre', 'movieActors.actor'],
      order: { screeningStart: 'ASC' },
      skip: offset,
      take: limit
    });

    return { items: movies.map((m) => new MovieResponseDto(m)), total };
  }

  async getNowShowingMovies(
    dto: PaginationDto
  ): Promise<{ items: MovieResponseDto[]; total: number }> {
    const { limit, offset } = dto;
    const now = new Date();

    const [movies, total] = await this.movieRepo
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.movieGenres', 'movieGenre')
      .leftJoinAndSelect('movieGenre.genre', 'genre')
      .leftJoinAndSelect('movie.movieActors', 'movieActor')
      .leftJoinAndSelect('movieActor.actor', 'actor')
      .where('movie.screeningStart <= :now', { now })
      .andWhere(
        new Brackets((qb) =>
          qb.where('movie.screeningEnd IS NULL').orWhere('movie.screeningEnd >= :now', { now })
        )
      )
      .orderBy('movie.screeningStart', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { items: movies.map((m) => new MovieResponseDto(m)), total };
  }

  async getTopRevenueMoviesThisMonth(): Promise<MovieResponseDto[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const movies = await this.movieRepo
      .createQueryBuilder('movie')
      .leftJoin('movie.showTimes', 'showTime')
      .leftJoin('showTime.bookings', 'booking')
      .select('movie')
      .addSelect('COALESCE(SUM(booking.totalBookingPrice), 0)', 'totalRevenue')
      .where('booking.dateTimeBooking BETWEEN :start AND :end', {
        start: startOfMonth,
        end: endOfMonth
      })
      .groupBy('movie.id')
      .orderBy('totalRevenue', 'DESC')
      .limit(5)
      .getRawAndEntities();

    // Gộp entity + tổng doanh thu
    const result = movies.entities.map((movie, i) => ({
      ...new MovieResponseDto(movie),
      totalRevenue: Number(movies.raw[i].totalRevenue) || 0
    }));

    return result;
  }

  async getMovieWithBranches(branchId: string): Promise<IPaginatedResponse<MovieResponseDto>> {
    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(now.getDate() + 7);

    const movies = await this.movieRepo
      .createQueryBuilder('movie')
      .innerJoin('movie.showTimes', 'showTime')
      .innerJoin('showTime.room', 'room')
      .innerJoin('room.branch', 'branch')
      .where('branch.id = :branchId', { branchId })
      .andWhere('showTime.timeStart BETWEEN :now AND :sevenDaysLater', { now, sevenDaysLater })
      .distinct(true)
      .getMany();

    if (movies.length === 0) {
      throw new BadRequest(RESPONSE_MESSAGES.MOVIE_NOT_FOUND);
    }

    return PaginationHelper.pagination({
      limit: movies.length,
      offset: 0,
      totalItems: movies.length,
      items: movies.map((movie) => new MovieResponseDto(movie))
    });
  }
}
