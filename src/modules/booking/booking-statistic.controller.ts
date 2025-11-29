import { BaseController } from '@bases/base-controller';
import { TimeGroupBy } from '@common/enums/booking.enum';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { Controller, Get, HttpCode, HttpStatus, ParseEnumPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BookingStatisticService } from './booking-statistic.service';
import { RevenueByMovie } from './interfaces/revenue-by-movie.interface';
import { RevenueByTimeDto } from './interfaces/revenue-by-time.interface';

@Controller('booking-statistics')
@ApiBearerAuth()
@ApiTags('BookingStatistics')
export class BookingStatisticController extends BaseController {
  constructor(private readonly bookingStatisticService: BookingStatisticService) {
    super();
  }

  @Get('revenue-by-movie')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get revenue statistics by movie' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics of revenue by movie retrieved successfully'
  })
  async getRevenueByMovie(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<SuccessResponse<RevenueByMovie[]>> {
    const result = await this.bookingStatisticService.getRevenueByMovie(startDate, endDate);

    return this.success(result);
  }

  @Get('revenue-by-time')
  @ApiOperation({ summary: 'Get revenue statistics by time' })
  @ApiQuery({
    name: 'groupBy',
    enum: TimeGroupBy,
    required: true,
    description: 'Group by: day, month, quarter, year'
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getRevenueByTime(
    @Query('groupBy', new ParseEnumPipe(TimeGroupBy)) groupBy: TimeGroupBy,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<SuccessResponse<RevenueByTimeDto[]>> {
    const result = await this.bookingStatisticService.getRevenueByTime(groupBy, startDate, endDate);

    return this.success(result);
  }
}
