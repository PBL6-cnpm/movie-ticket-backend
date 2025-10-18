import { BaseController } from '@bases/base-controller';
import { Public } from '@common/decorators/public.decorator';
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
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSeatDto } from './dto/create-seat.dto';
import { SeatByRoomResponseDto } from './dto/seat-by-room.dto';
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

  @Get('get-with-showtime/:showTimeId')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Get seats by showtime',
    description: 'Retrieves all seats in a room for a specific showtime with booking status'
  })
  @ApiParam({
    name: 'showTimeId',
    description: 'The UUID of the showtime',
    example: '2199934e-4db7-4f6c-ba7a-aca3947647c2'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Seats retrieved successfully',
    type: SeatByRoomResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Showtime not found or room has no seats'
  })
  async getSeatsByShowTime(
    @Param('showTimeId') showTimeId: string
  ): Promise<SuccessResponse<SeatByRoomResponseDto>> {
    const seats = await this.seatService.getSeatsByShowTime(showTimeId);
    return this.success(seats);
  }
}
