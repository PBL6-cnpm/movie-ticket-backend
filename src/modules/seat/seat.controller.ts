import { BaseController } from '@bases/base-controller';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSeatDto } from './dto/create-seat.dto';
import { SeatResponseDto } from './dto/seat-response.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { SeatService } from './seat.service';

@Controller('seats')
@ApiTags('Seat')
export class SeatController extends BaseController {
  constructor(private readonly seatService: SeatService) {
    super();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new seat'
  })
  async createSeat(
    @Body() createSeatDto: CreateSeatDto
  ): Promise<SuccessResponse<SeatResponseDto>> {
    const newSeat = await this.seatService.createSeat(createSeatDto);

    const response = new SeatResponseDto(newSeat);
    return this.created(response);
  }

  @Get('/room/:roomId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all seat by roomId'
  })
  async getAllSeatByRoomId(
    @Param('roomId') roomId: string
  ): Promise<SuccessResponse<SeatResponseDto[]>> {
    const seats = await this.seatService.getAllSeatsByRoomId(roomId);
    const response = seats.map((seat) => new SeatResponseDto(seat));

    return this.success(response);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update seat'
  })
  async updateSeat(
    @Param('id') id: string,
    @Body() updateSeatDto: UpdateSeatDto
  ): Promise<SuccessResponse<SeatResponseDto>> {
    const updateSeat = await this.seatService.updateSeat(id, updateSeatDto);
    const response = new SeatResponseDto(updateSeat);
    return this.success(response);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete seat'
  })
  async deleteSeat(@Param('id') id: string): Promise<SuccessResponse<null>> {
    await this.seatService.deleteSeat(id);
    return this.success(null);
  }
}
