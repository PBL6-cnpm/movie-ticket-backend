import { BaseController } from '@bases/base-controller';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { IPaginatedResponse, PaginationDto } from '@common/types/pagination-base.type';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTypeSeatDto } from './dto/create-type-seat.dto';
import { TypeSeatResponseDto } from './dto/type-seat-response.dto';
import { UpdateTypeSeatDto } from './dto/update-type-seat.dto';
import { TypeSeatService } from './typeSeat.service';

@Controller('type-seats')
@ApiBearerAuth()
@ApiTags('TypeSeats')
export class TypeSeatController extends BaseController {
  constructor(private readonly typeSeatService: TypeSeatService) {
    super();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get type seat by ID' })
  async getTypeSeatById(@Param('id') id: string): Promise<SuccessResponse<TypeSeatResponseDto>> {
    const result = await this.typeSeatService.getTypeSeatById(id);
    return this.success(result);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all type seats' })
  async getAllTypeSeats(
    @Query() dto: PaginationDto
  ): Promise<SuccessResponse<IPaginatedResponse<TypeSeatResponseDto>>> {
    const result = await this.typeSeatService.getAllTypeSeats(dto);
    return this.success(result);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new type seat' })
  async createTypeSeat(
    @Body() createTypeSeatDto: CreateTypeSeatDto
  ): Promise<SuccessResponse<TypeSeatResponseDto>> {
    const result = await this.typeSeatService.createTypeSeat(createTypeSeatDto);
    return this.created(result);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current status of type seat by ID' })
  async updateTypeSeat(
    @Param('id') id: string,
    @Body() updateTypeSeatDto: UpdateTypeSeatDto
  ): Promise<SuccessResponse<TypeSeatResponseDto>> {
    const result = await this.typeSeatService.updateTypeSeat(id, updateTypeSeatDto);
    return this.success(result);
  }
}
