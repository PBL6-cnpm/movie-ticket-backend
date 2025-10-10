import { BaseController } from '@bases/base-controller';
import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewService } from './review.service';

@Controller('reviews')
@ApiBearerAuth()
@ApiTags('Reviews')
export class ReviewController extends BaseController {
  constructor(private readonly reviewService: ReviewService) {
    super();
  }
}
