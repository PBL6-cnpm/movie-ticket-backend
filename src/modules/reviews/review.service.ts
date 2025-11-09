import { RESPONSE_MESSAGES } from '@common/constants';
import { BadRequest } from '@common/exceptions';
import { IPaginatedResponse, PaginationDto } from '@common/types/pagination-base.type';
import PaginationHelper from '@common/utils/pagination.util';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from '@shared/db/entities/account.entity';
import { Movie } from '@shared/db/entities/movie.entity';
import { Review } from '@shared/db/entities/review.entity';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetReviewDto } from './dto/get-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,

    @InjectRepository(Movie)
    private readonly movieRepo: Repository<Movie>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>
  ) {}

  async getDetailReview(getReviewDto: GetReviewDto): Promise<ReviewResponseDto> {
    const review = await this.reviewRepo.findOne({
      where: {
        movieId: getReviewDto.movieId,
        accountId: getReviewDto.accountId
      },
      relations: ['account']
    });
    if (!review) {
      throw new BadRequest(RESPONSE_MESSAGES.REVIEW_NOT_FOUND);
    }
    return new ReviewResponseDto(review);
  }

  async getAllMovieReviews(
    movieId: string,
    dto: PaginationDto
  ): Promise<IPaginatedResponse<ReviewResponseDto>> {
    const { limit, offset } = dto;
    const [reviews, total] = await this.reviewRepo.findAndCount({
      where: { movieId: movieId },
      order: { createdAt: 'DESC' },
      relations: ['account'],
      skip: offset,
      take: limit
    });

    const items = reviews.map((item) => new ReviewResponseDto(item));

    const paginated = PaginationHelper.pagination({
      limit: dto.limit,
      offset: dto.offset,
      totalItems: total,
      items
    });

    return paginated;
  }

  async getLatestReviews(): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewRepo.find({
      relations: ['account', 'movie', 'movie.movieGenres', 'movie.movieGenres.genre'],
      order: { createdAt: 'DESC' },
      take: 10
    });

    return reviews.map((item) => new ReviewResponseDto(item, true));
  }

  async createReview(
    accountId: string,
    createReviewDto: CreateReviewDto
  ): Promise<ReviewResponseDto> {
    const movieId = createReviewDto.movieId;

    const [movie, existingReview] = await Promise.all([
      this.movieRepo.findOne({ where: { id: movieId } }),

      this.reviewRepo.findOne({ where: { movieId, accountId } })
    ]);

    if (!movie) {
      throw new BadRequest(RESPONSE_MESSAGES.MOVIE_NOT_FOUND);
    }

    if (existingReview) {
      throw new BadRequest(RESPONSE_MESSAGES.REVIEW_ALREADY_EXISTS);
    }

    const review = await this.reviewRepo.save({
      ...createReviewDto,
      accountId
    });

    const account = await this.accountRepo.findOne({
      where: { id: accountId },
      select: ['id', 'email', 'avatarUrl']
    });

    review.account = account;

    return new ReviewResponseDto(review);
  }

  async updateReview(
    accountId: string,
    updateReviewDto: UpdateReviewDto
  ): Promise<ReviewResponseDto> {
    const movieId = updateReviewDto.movieId;

    const [movie, existingReview] = await Promise.all([
      this.movieRepo.findOne({ where: { id: movieId } }),

      this.reviewRepo.findOne({ where: { movieId, accountId } })
    ]);

    if (!movie) {
      throw new BadRequest(RESPONSE_MESSAGES.MOVIE_NOT_FOUND);
    }

    if (!existingReview) {
      throw new BadRequest(RESPONSE_MESSAGES.REVIEW_NOT_FOUND);
    }

    await this.reviewRepo.update({ movieId, accountId }, updateReviewDto);

    const updatedReview = await this.reviewRepo.findOne({
      where: { movieId, accountId },
      relations: ['account']
    });

    return new ReviewResponseDto(updatedReview);
  }
  async deleteReview(accountId: string, movieId: string): Promise<void> {
    const existingReview = await this.reviewRepo.findOne({
      where: { movieId, accountId }
    });

    if (!existingReview) {
      throw new BadRequest(RESPONSE_MESSAGES.REVIEW_NOT_FOUND);
    }

    await this.reviewRepo.delete({ movieId, accountId });
  }
  async getMyReview(accountId: string): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewRepo.find({
      where: { accountId },
      relations: ['account'],
      order: { createdAt: 'DESC' }
    });

    if (!reviews.length) {
      return [];
    }

    return reviews.map((review) => new ReviewResponseDto(review));
  }
}
