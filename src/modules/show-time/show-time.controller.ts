import { BaseController } from '@bases/base-controller';
import { RESPONSE_MESSAGES } from '@common/constants';
import { CurrentAccount } from '@common/decorators/current-account.decorator';
import { Public } from '@common/decorators/public.decorator';
import { BadRequest } from '@common/exceptions';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { IPaginatedResponse } from '@common/types/pagination-base.type';
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
  Put
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateShowTimeDto } from './dto/create-show-time.dto';
import { ShowTimeGroupedResponseDto, ShowTimeResponseDto } from './dto/show-time-response.dto';
import { UpdateShowTimeDto } from './dto/update-show-time.dto';
import { ShowTimeService } from './show-time.service';

@Controller('show-time')
@ApiBearerAuth()
@ApiTags('Show Times')
export class ShowTimeController extends BaseController {
  constructor(private readonly showTimeService: ShowTimeService) {
    super();
  }

  @Public()
  @Get('get-with-movie/:id')
  async getShowTimesWithMovie(
    @Param('id') movieId: string
  ): Promise<SuccessResponse<IPaginatedResponse<ShowTimeGroupedResponseDto>>> {
    const result = await this.showTimeService.getShowTimesWithMovie(movieId);
    return this.success(result);
  }

  @Get('show-date/:date')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get show time by date' })
  async getShowTimeByDate(
    @Param('date') date: Date,
    @CurrentAccount() account: ContextUser
  ): Promise<SuccessResponse<ShowTimeResponseDto[]>> {
    if (!account.branchId) {
      throw new BadRequest(RESPONSE_MESSAGES.USER_NO_BRANCH_ASSIGNED);
    }

    const showTimes = await this.showTimeService.getShowTimeByShowDateAndBranchId(
      date,
      account.branchId
    );

    const response = showTimes.map((showTime) => new ShowTimeResponseDto(showTime));
    return this.success(response);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new show time' })
  async createShowTime(
    @CurrentAccount() account: ContextUser,
    @Body() createShowTimeDto: CreateShowTimeDto
  ): Promise<SuccessResponse<ShowTimeResponseDto>> {
    if (!account.branchId) {
      throw new BadRequest(RESPONSE_MESSAGES.USER_NO_BRANCH_ASSIGNED);
    }

    const newShowTime = await this.showTimeService.createShowTime(
      account.branchId,
      createShowTimeDto
    );

    const response = new ShowTimeResponseDto(newShowTime);
    return this.created(response);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update show time'
  })
  async updateShowTime(
    @Param('id') id: string,
    @CurrentAccount() account: ContextUser,
    @Body() updateShowTimeDto: UpdateShowTimeDto
  ): Promise<SuccessResponse<ShowTimeResponseDto>> {
    if (!account.branchId) {
      throw new BadRequest(RESPONSE_MESSAGES.USER_NO_BRANCH_ASSIGNED);
    }

    const updatedShowTime = await this.showTimeService.updateShowTime(id, account.branchId, {
      movieId: updateShowTimeDto.movieId,
      roomId: updateShowTimeDto.roomId,
      timeStart: updateShowTimeDto.timeStart,
      showDate: updateShowTimeDto.showDate
    });

    const response = new ShowTimeResponseDto(updatedShowTime);
    return this.success(response);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete show time'
  })
  async deleteShowTime(
    @Param('id') id: string,
    @CurrentAccount() account: ContextUser
  ): Promise<SuccessResponse<null>> {
    if (!account.branchId) {
      throw new BadRequest(RESPONSE_MESSAGES.USER_NO_BRANCH_ASSIGNED);
    }

    await this.showTimeService.deleteShowTime(id, account.branchId);
    return this.success(null);
  }
}
