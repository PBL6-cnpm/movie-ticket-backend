import { BaseService } from '@bases/base-service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from '@shared/db/entities/review.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ReviewService extends BaseService<Review> {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>
  ) {
    super(reviewRepo);
  }
}
