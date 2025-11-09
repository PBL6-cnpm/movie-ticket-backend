import { ShowTimeGroupedResponseDto } from '@modules/show-time/dto/show-time-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Movie } from '@shared/db/entities/movie.entity';

class BranchMovieGenreDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

class BranchMovieActorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description?: string;

  @ApiProperty({ nullable: true })
  picture?: string;
}

export class BranchMovieInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description?: string;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  ageLimit: number;

  @ApiProperty()
  director: string;

  @ApiProperty({ nullable: true })
  trailer?: string;

  @ApiProperty({ nullable: true })
  poster?: string;

  @ApiProperty({ type: Date, nullable: true })
  releaseDate?: Date;

  @ApiProperty({ type: Date, nullable: true })
  screeningStart?: Date;

  @ApiProperty({ type: Date, nullable: true })
  screeningEnd?: Date;

  @ApiProperty({ type: () => [BranchMovieGenreDto] })
  genres: BranchMovieGenreDto[];

  @ApiProperty({ type: () => [BranchMovieActorDto] })
  actors: BranchMovieActorDto[];

  constructor(movie: Movie) {
    this.id = movie.id;
    this.name = movie.name;
    this.description = movie.description;
    this.duration = movie.duration;
    this.ageLimit = movie.ageLimit;
    this.director = movie.director;
    this.trailer = movie.trailer;
    this.poster = movie.poster;
    this.releaseDate = movie.releaseDate;
    this.screeningStart = movie.screeningStart;
    this.screeningEnd = movie.screeningEnd;
    this.genres = movie.movieGenres
      ? movie.movieGenres
          .filter((mg) => mg.genre)
          .map((mg) => ({ id: mg.genre.id, name: mg.genre.name }))
      : [];
    this.actors = movie.movieActors
      ? movie.movieActors
          .filter((ma) => ma.actor)
          .map((ma) => ({
            id: ma.actor.id,
            name: ma.actor.name,
            description: ma.actor.description,
            picture: ma.actor.picture
          }))
      : [];
  }
}

export class BranchMovieShowTimeResponseDto {
  @ApiProperty({ type: BranchMovieInfoDto })
  movie: BranchMovieInfoDto;

  @ApiProperty({ type: () => [ShowTimeGroupedResponseDto] })
  showTimes: ShowTimeGroupedResponseDto[];

  constructor(movie: Movie, showTimes: ShowTimeGroupedResponseDto[]) {
    this.movie = new BranchMovieInfoDto(movie);
    this.showTimes = showTimes;
  }
}
