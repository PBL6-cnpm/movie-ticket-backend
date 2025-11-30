import { BaseController } from '@bases/base-controller';
import { CurrentAccount } from '@common/decorators/current-account.decorator';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { ContextUser } from '@common/types/user.type';
import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportService } from './report.service';

import { PopularMovieResponseDto } from './dto/popular-movie-response.dto';
import { RevenueResponseDto } from './dto/revenue-response.dto';

@Controller('reports')
@ApiBearerAuth()
@ApiTags('Reports')
export class ReportController extends BaseController {
  constructor(private readonly reportService: ReportService) {
    super();
  }

  @Get('revenue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get revenue statistics' })
  async getRevenue(
    @CurrentAccount() account: ContextUser,
    @Query('period') period: 'day' | 'week' | 'month' = 'day'
  ): Promise<SuccessResponse<RevenueResponseDto>> {
    const result = await this.reportService.getRevenue(account.branchId, period);
    return this.success(result);
  }

  @Get('popular-movies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get popular movies' })
  async getPopularMovies(
    @CurrentAccount() account: ContextUser
  ): Promise<SuccessResponse<PopularMovieResponseDto[]>> {
    const result = await this.reportService.getPopularMovies(account.branchId);
    return this.success(result);
  }
}
