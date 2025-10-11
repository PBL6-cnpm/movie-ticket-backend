import { BaseService } from '@bases/base-service';
import { RESPONSE_MESSAGES } from '@common/constants';
import { BadRequest } from '@common/exceptions';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from '@shared/db/entities/branch.entity';
import { Room } from '@shared/db/entities/room.entity';
import { Not, Repository } from 'typeorm';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomService extends BaseService<Room> {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>
  ) {
    super(roomRepository);
  }

  async createRoom({ name, branchId }: { name: string; branchId: string }): Promise<Room> {
    // Kiểm tra tên phòng đã tồn tại trong branch chưa
    const existingRoom = await this.findOne({
      where: {
        branchId: branchId,
        name: name
      }
    });

    if (existingRoom) {
      throw new ConflictException(RESPONSE_MESSAGES.ROOM_NAME_ALREADY_EXISTS_IN_BRANCH);
    }

    const exstingBranch = await this.branchRepository.findOne({
      where: { id: branchId }
    });

    if (!exstingBranch) {
      throw new ConflictException(RESPONSE_MESSAGES.BRANCH_NOT_FOUND);
    }

    // Tạo phòng mới
    const newRoom = await this.create({
      branchId: branchId,
      name: name
    });

    return newRoom;
  }

  async getRoomById(roomId: string): Promise<Room> {
    const room = await this.findOneById(roomId);

    if (!room) {
      throw new BadRequest(RESPONSE_MESSAGES.ROOM_NOT_FOUND);
    }

    return room;
  }

  async updateRoom(roomId: string, updateRoomDto: UpdateRoomDto, branchId: string): Promise<Room> {
    // Kiểm tra room có tồn tại không
    const existingRoom = await this.findOneById(roomId, {
      relations: ['branch']
    });

    if (!existingRoom) {
      throw new BadRequest(RESPONSE_MESSAGES.ROOM_NOT_FOUND);
    }

    if (!branchId || branchId != existingRoom.branchId) {
      throw new BadRequest(RESPONSE_MESSAGES.USER_NO_BRANCH_ASSIGNED);
    }

    // Kiểm tra tên phòng mới có bị trùng không (nếu có update tên hoặc branchId)
    if (updateRoomDto.name && updateRoomDto.name !== existingRoom.name) {
      const conflictRoom = await this.findOne({
        where: {
          branchId: existingRoom.branchId,
          name: updateRoomDto.name || existingRoom.name,
          id: Not(roomId)
        }
      });

      if (conflictRoom) {
        throw new ConflictException(RESPONSE_MESSAGES.ROOM_NAME_ALREADY_EXISTS_IN_BRANCH);
      }
    }

    // Cập nhật room
    await this.updateById(roomId, updateRoomDto);

    // Load lại room với relations
    const updatedRoom = await this.findOneById(roomId);

    if (!updatedRoom) {
      throw new BadRequest(RESPONSE_MESSAGES.ROOM_NOT_FOUND);
    }

    return updatedRoom;
  }

  async deleteRoom(roomId: string, branchId: string): Promise<void> {
    const room = await this.findOneById(roomId, {
      relations: ['showTimes', 'branch']
    });

    if (!branchId || branchId != room.branchId) {
      throw new BadRequest(RESPONSE_MESSAGES.USER_NO_BRANCH_ASSIGNED);
    }

    if (!room) {
      throw new BadRequest(RESPONSE_MESSAGES.ROOM_NOT_FOUND);
    }

    // Kiểm tra xem phòng có showtime nào không
    if (room.showTimes && room.showTimes.length > 0) {
      throw new ConflictException(RESPONSE_MESSAGES.ROOM_HAS_SHOWTIMES_CANNOT_DELETE);
    }

    await this.deleteById(roomId);
  }

  async getRoomsByBranchId(branchId: string): Promise<Room[]> {
    return this.roomRepository.find({
      where: { branchId },
      order: { name: 'ASC' }
    });
  }
}
