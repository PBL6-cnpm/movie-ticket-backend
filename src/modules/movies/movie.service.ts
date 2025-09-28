import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { BadRequest } from '@common/exceptions/bad-request.exception';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor } from 'shared/db/entities/actor.entity';
import { Genre } from 'shared/db/entities/genre.entity';
import { MovieActor } from 'shared/db/entities/movie-actor.entity';
import { Movie } from 'shared/db/entities/movie.entity';
import { MovieGenre } from 'shared/db/entities/movie_genre.entity';
import { Repository } from 'typeorm';
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
    private readonly movieGenreRepo: Repository<MovieGenre>
  ) {}

  async createMovie(
    createRequest: CreateMovieDto,
    poster?: Express.Multer.File
  ): Promise<MovieResponseDto> {
    const existingMovie = await this.movieRepo.findOne({ where: { name: createRequest.name } });
    if (existingMovie) {
      throw new Error(`Movie with name ${createRequest.name} already exists`);
    }

    let cloudUrl = '';

    if (poster) {
      cloudUrl = await this.cloudinaryService.uploadFileBuffer(poster);
    } else {
      throw new Error('Poster file is required');
    }
    const movie = this.movieRepo.create({
      ...createRequest,
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
      relations: ['movieGenres', 'movieGenres.genre', 'movieActors', 'movieActors.actor']
    });
    if (!movie) {
      throw new BadRequest(RESPONSE_MESSAGES.MOVIE_NOT_FOUND);
    }
    return new MovieResponseDto(movie);
  }

  async updateMovie(
    id: string,
    updateDto: UpdateMovieDto,
    poster?: Express.Multer.File
  ): Promise<MovieResponseDto> {
    const movie = await this.movieRepo.findOne({ where: { id } });
    if (!movie) throw new BadRequest(RESPONSE_MESSAGES.MOVIE_NOT_FOUND);

    let cloudUrl = movie.poster;
    if (poster) {
      cloudUrl = await this.cloudinaryService.uploadFileBuffer(poster);
    }

    Object.assign(movie, updateDto, { poster: cloudUrl });
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

  async searchByName(name: string): Promise<MovieResponseDto[]> {
    const movies = await this.movieRepo
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.movieGenres', 'movieGenre')
      .leftJoinAndSelect('movieGenre.genre', 'genre')
      .leftJoinAndSelect('movie.movieActors', 'movieActor')
      .leftJoinAndSelect('movieActor.actor', 'actor')
      .where('movie.name COLLATE utf8mb4_unicode_ci LIKE :name', { name: `%${name}%` })
      .orWhere('actor.name COLLATE utf8mb4_unicode_ci LIKE :name', { name: `%${name}%` })
      .getMany();

    return movies.map((m) => new MovieResponseDto(m));
  }

  async getAllGenres(): Promise<{ id: string; name: string }[]> {
    const genres = await this.genreRepo.find({ order: { name: 'ASC' } });
    return genres.map((g) => ({ id: g.id, name: g.name }));
  }

  async filterMovies(genres: string[] = []): Promise<MovieResponseDto[]> {
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

    const movies = await query.getMany();
    return movies.map((m) => new MovieResponseDto(m));
  }
}
