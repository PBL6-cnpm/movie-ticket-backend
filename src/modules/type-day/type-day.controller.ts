import { BaseController } from '@bases/base-controller';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TypeDay } from '@shared/db/entities/type-day.entity';
import { TypeDayResponseDto } from './dto/type-day-response.dto';
import { UpdateTypeDayDto } from './dto/update-type-day.dto';
import { TypeDayService } from './type-day.service';

@Controller('type-day')
@ApiBearerAuth()
@ApiTags('TypeDays')
export class TypeDayController extends BaseController {
  private readonly logger = new Logger(TypeDayController.name);

  constructor(private readonly typeDayService: TypeDayService) {
    super();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all type day'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of type day successfully',
    type: [TypeDayResponseDto]
  })
  async getAllTypeDay(): Promise<SuccessResponse<TypeDayResponseDto[]>> {
    this.logger.log('Get All Type Day');

    const typeDays = await this.typeDayService.getAllTypeDay();

    const response = typeDays.map((typeDay: TypeDay) => new TypeDayResponseDto(typeDay));

    return this.success(response);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Type Day'
  })
  async updateTypeDay(
    @Param('id') id: string,
    @Body() updateTypeDayDto: UpdateTypeDayDto
  ): Promise<SuccessResponse<TypeDayResponseDto>> {
    this.logger.log('Update type day');
    const typeDay = await this.typeDayService.updateTypeDay(id, updateTypeDayDto);
    const response = new TypeDayResponseDto(typeDay);

    return this.success(response);
  }
}
