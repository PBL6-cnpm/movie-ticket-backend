import { BaseReviewDto } from './base-review.dto';
import { OmitType } from '@nestjs/swagger';

export class CreateReviewDto extends OmitType(BaseReviewDto, ['accountId']) {}
