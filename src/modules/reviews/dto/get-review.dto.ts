import { BaseReviewDto } from './base-review.dto';
import { PickType } from '@nestjs/swagger';

export class GetReviewDto extends PickType(BaseReviewDto, ['movieId', 'accountId']) {}
