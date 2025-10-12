import { ReviewResponseDto } from '@modules/reviews/dto/review-response.dto';
import { Movie } from '@shared/db/entities/movie.entity';

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
  screeningStart: Date;
  screeningEnd: Date;
  averageRating?: number | null;

  genres: { id: string; name: string }[];
  actors: { id: string; name: string; picture: string }[];

  reviews?: ReviewResponseDto[];

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
    this.screeningStart = movie.screeningStart;
    this.screeningEnd = movie.screeningEnd;

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

    if (movie.reviews) {
      this.reviews = movie.reviews.map((r) => new ReviewResponseDto(r));

      if (movie.reviews.length > 0) {
        const sum = movie.reviews.reduce((s, r) => s + (r.rating ?? 0), 0);
        this.averageRating = Number((sum / movie.reviews.length).toFixed(2));
      } else {
        this.averageRating = null;
      }
    }
  }
}
