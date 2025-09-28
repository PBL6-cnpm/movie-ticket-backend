import { Movie } from 'shared/db/entities/movie.entity';

export class MovieResponseDto {
  id: string;
  name: string;
  description: string;
  duration: number;
  ageLimit: number;
  director: string;
  trailer: string;
  poster: string;
  releaseDate: Date;

  genres: { id: string; name: string }[];
  actors: { id: string; name: string; picture: string }[];

  createdAt: Date;
  updatedAt: Date;

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

    this.genres = movie.movieGenres
      ? movie.movieGenres.map((mg) => ({
          id: mg.genre.id,
          name: mg.genre.name
        }))
      : [];

    this.actors = movie.movieActors
      ? movie.movieActors.map((ma) => ({
          id: ma.actor.id,
          name: ma.actor.name,
          picture: ma.actor.picture
        }))
      : [];

    this.createdAt = movie.createdAt;
    this.updatedAt = movie.updatedAt;
  }
}
