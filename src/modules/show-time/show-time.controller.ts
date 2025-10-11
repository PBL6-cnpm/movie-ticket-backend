import { BaseController } from '@bases/base-controller';
import { Public } from '@common/decorators/public.decorator';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { IPaginatedResponse } from '@common/types/pagination-base.type';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ShowTimeGroupedResponseDto } from './dto/show-time-response.dto';
import { ShowTimeService } from './show-time.service';

@Controller('show-time')
@Public()
@ApiTags('Show Times')
export class ShowTimeController extends BaseController {
  constructor(private readonly showTimeService: ShowTimeService) {
    super();
  }

  @Get('get-with-movie/:id')
  async getShowTimesWithMovie(
    @Param('id') movieId: string
  ): Promise<SuccessResponse<IPaginatedResponse<ShowTimeGroupedResponseDto>>> {
    const result = await this.showTimeService.getShowTimesWithMovie(movieId);
    return this.success(result);
  }
}
