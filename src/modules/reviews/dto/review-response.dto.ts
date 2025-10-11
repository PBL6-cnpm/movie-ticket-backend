import { Review } from '@shared/db/entities/review.entity';

export class ReviewResponseDto {
  rating: number;
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
  account: {
    id: string;
    fullName: string;
    avatarUrl: string;
  };
  movieId: string;
  movie: {
    id: string;
    name: string;
    poster: string;
    genres: string[];
  };

  constructor(review: Review, getMovieDetails = false) {
    this.rating = review.rating;
    this.comment = review.comment;
    this.createdAt = review.createdAt;
    this.updatedAt = review.updatedAt;

    this.account = {
      id: review.account.id,
      fullName: review.account.fullName,
      avatarUrl: review.account.avatarUrl
    };

    if (getMovieDetails) {
      this.movie = {
        id: review.movie.id,
        name: review.movie.name,
        poster: review.movie.poster,
        genres: review.movie.movieGenres?.map((mg) => mg.genre.name) || []
      };
    } else {
      this.movieId = review.movieId;
    }
  }
}
