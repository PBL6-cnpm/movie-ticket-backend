import { BaseController } from '@bases/base-controller';
import { RESPONSE_MESSAGES } from '@common/constants';
import { CurrentAccount } from '@common/decorators/current-account.decorator';
import { BadRequest } from '@common/exceptions';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomService } from './room.service';

@Controller('rooms')
@ApiTags('Room')
export class RoomController extends BaseController {
  constructor(private readonly roomService: RoomService) {
    super();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new room'
  })
  async createRoom(
    @CurrentAccount() account: ContextUser,
    @Body() createRoomDto: CreateRoomDto
  ): Promise<SuccessResponse<RoomResponseDto>> {
    if (!account.branchId) {
      throw new BadRequest(RESPONSE_MESSAGES.USER_NO_BRANCH_ASSIGNED);
    }

    const newRoom = await this.roomService.createRoom({
      name: createRoomDto.name,
      branchId: account.branchId
    });

    const response = new RoomResponseDto(newRoom);
    return this.created(response);
  }

  @Get('my-branch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get rooms by current user branch',
    description: "Retrieve all rooms belonging to the current user's branch from access token"
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user branch rooms retrieved successfully',
    type: [RoomResponseDto]
  })
  async getRoomsByCurrentUserBranch(
    @CurrentAccount() account: ContextUser
  ): Promise<SuccessResponse<RoomResponseDto[]>> {
    if (!account.branchId) {
      throw new BadRequest(RESPONSE_MESSAGES.USER_NO_BRANCH_ASSIGNED);
    }

    const rooms = await this.roomService.getRoomsByBranchId(account.branchId);
    const response = rooms.map((room) => new RoomResponseDto(room));
    return this.success(response);
  }

  @Get('branch/:branchId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get rooms by branch ID',
    description: 'Retrieve all rooms belonging to a specific branch'
  })
  async getRoomsByBranch(
    @Param('branchId') branchId: string
  ): Promise<SuccessResponse<RoomResponseDto[]>> {
    const rooms = await this.roomService.getRoomsByBranchId(branchId);
    const response = rooms.map((room) => new RoomResponseDto(room));
    return this.success(response);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get room by ID'
  })
  async getRoomById(@Param('id') id: string): Promise<SuccessResponse<RoomResponseDto>> {
    const room = await this.roomService.getRoomById(id);
    const response = new RoomResponseDto(room);
    return this.success(response);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update room'
  })
  async updateRoom(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @CurrentAccount() account: ContextUser
  ): Promise<SuccessResponse<RoomResponseDto>> {
    const updatedRoom = await this.roomService.updateRoom(id, updateRoomDto, account.branchId);
    const response = new RoomResponseDto(updatedRoom);
    return this.success(response);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete room',
    description: 'Delete a room. Cannot delete if the room has any showtimes.'
  })
  async deleteRoom(
    @Param('id') id: string,
    @CurrentAccount() account: ContextUser
  ): Promise<SuccessResponse<null>> {
    await this.roomService.deleteRoom(id, account.branchId);
    return this.success(null);
  }
}
