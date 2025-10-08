import { Review } from 'shared/db/entities/review.entity';

export class ReviewResponseDto {
  movieId: string;
  accountId: string;
  rating: number;
  comment: string;
  accountName?: string | null;
  createdAt?: Date;

  constructor(review: Review) {
    this.movieId = review.movieId;
    this.accountId = review.accountId;
    this.rating = review.rating;
    this.comment = review.comment;
    this.accountName = review.account?.fullName ?? review.account?.email ?? null;
    this.createdAt = review.createdAt;
  }
}
