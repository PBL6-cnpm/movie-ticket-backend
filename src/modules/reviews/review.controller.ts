import { BaseController } from '@bases/base-controller';
import { CurrentAccount } from '@common/decorators/current-account.decorator';
import { Permissions } from '@common/decorators/permissions.decorator';
import { Public } from '@common/decorators/public.decorator';
import { PermissionName } from '@common/enums';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { IPaginatedResponse, PaginationDto } from '@common/types/pagination-base.type';
import { ContextUser } from '@common/types/user.type';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetReviewDto } from './dto/get-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';

@Controller('reviews')
@ApiBearerAuth()
@ApiTags('Reviews')
export class ReviewController extends BaseController {
  constructor(private readonly reviewService: ReviewService) {
    super();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get review detail' })
  @Permissions(PermissionName.REVIEW_READ)
  async getReviewDetail(
    @Body() getReviewDto: GetReviewDto
  ): Promise<SuccessResponse<ReviewResponseDto>> {
    const result = await this.reviewService.getDetailReview(getReviewDto);
    return this.success(result);
  }

  @Get('all/movies/:movieId')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all reviews of a movie' })
  async getAllMovieReviews(
    @Param('movieId') movieId: string,
    @Query() dto: PaginationDto
  ): Promise<SuccessResponse<IPaginatedResponse<ReviewResponseDto>>> {
    const result = await this.reviewService.getAllMovieReviews(movieId, dto);
    return this.success(result);
  }

  @Get('latest')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get latest reviews' })
  async getLatestReviews(): Promise<SuccessResponse<ReviewResponseDto[]>> {
    const result = await this.reviewService.getLatestReviews();
    return this.success(result);
  }
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my review for a movie' })
  @Permissions(PermissionName.REVIEW_READ)
  async getMyReview(
    @CurrentAccount() account: ContextUser
  ): Promise<SuccessResponse<ReviewResponseDto[]>> {
    const result = await this.reviewService.getMyReview(account.id);
    return this.success(result);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new review' })
  @Permissions(PermissionName.REVIEW_CREATE_IN_MOVIE)
  async createReview(
    @CurrentAccount() account: ContextUser,
    @Body() createReviewDto: CreateReviewDto
  ): Promise<SuccessResponse<ReviewResponseDto>> {
    const result = await this.reviewService.createReview(account.id, createReviewDto);
    return this.created(result);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a review' })
  @Permissions(PermissionName.REVIEW_UPDATE_IN_MOVIE)
  async updateReview(
    @CurrentAccount() account: ContextUser,
    @Body() updateReviewDto: UpdateReviewDto
  ): Promise<SuccessResponse<ReviewResponseDto>> {
    const result = await this.reviewService.updateReview(account.id, updateReviewDto);
    return this.success(result);
  }

  @Delete('/movies/:movieId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review' })
  @Permissions(PermissionName.REVIEW_DELETE_IN_MOVIE)
  async deleteReview(
    @CurrentAccount() account: ContextUser,
    @Param('movieId') movieId: string
  ): Promise<SuccessResponse<null>> {
    await this.reviewService.deleteReview(account.id, movieId);
    return this.deleted();
  }
}
