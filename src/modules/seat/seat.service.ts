import { BaseService } from '@bases/base-service';
import { RESPONSE_MESSAGES } from '@common/constants';
import { BadRequest } from '@common/exceptions';
import { ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from '@shared/db/entities/room.entity';
import { Seat } from '@shared/db/entities/seat.entity';
import { TypeSeat } from '@shared/db/entities/type-seat.entity';
import { Not, Repository } from 'typeorm';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';

export class SeatService extends BaseService<Seat> {
  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,

    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(TypeSeat)
    private readonly typeSeatRepository: Repository<TypeSeat>
  ) {
    super(seatRepository);
  }

  async createSeat(createSeatDto: CreateSeatDto): Promise<Seat> {
    const existingSeat = await this.findOne({
      where: {
        roomId: createSeatDto.roomId,
        name: createSeatDto.name
      }
    });

    if (existingSeat) {
      throw new ConflictException(RESPONSE_MESSAGES.SEAT_NAME_ALREADY_EXISTS_IN_ROOM);
    }

    const existingRoom = await this.roomRepository.findOne({
      where: { id: createSeatDto.roomId }
    });

    if (!existingRoom) {
      throw new ConflictException(RESPONSE_MESSAGES.ROOM_NOT_FOUND);
    }

    const existingTypeSeat = await this.typeSeatRepository.findOne({
      where: { id: createSeatDto.typeSeatId }
    });

    if (!existingTypeSeat) {
      throw new ConflictException(RESPONSE_MESSAGES.TYPE_SEAT_NOT_FOUND);
    }

    // Tạo seat mới
    const newSeat = await this.create({
      roomId: createSeatDto.roomId,
      typeSeatId: createSeatDto.typeSeatId,
      name: createSeatDto.name
    });

    const createSeat = await this.findOneById(newSeat.id, {
      relations: ['typeSeat']
    });

    return createSeat;
  }

  async updateSeat(seatId: string, updateSeatDto: UpdateSeatDto): Promise<Seat> {
    const existingSeat = await this.findOneById(seatId, {
      relations: ['typeSeat', 'room']
    });

    if (!existingSeat) {
      throw new BadRequest(RESPONSE_MESSAGES.SEAT_NOT_FOUND);
    }

    const existingTypeSeat = await this.typeSeatRepository.findOne({
      where: {
        id: updateSeatDto.typeSeatId
      }
    });

    if (!existingTypeSeat) {
      throw new BadRequest(RESPONSE_MESSAGES.TYPE_SEAT_NOT_FOUND);
    }

    if (updateSeatDto.name && updateSeatDto.name !== existingSeat.name) {
      const conflictSeat = await this.findOne({
        where: {
          roomId: existingSeat.roomId,
          name: updateSeatDto.name || existingSeat.name,
          id: Not(seatId)
        }
      });

      if (conflictSeat) {
        throw new ConflictException(RESPONSE_MESSAGES.SEAT_NAME_ALREADY_EXISTS_IN_ROOM);
      }
    }

    await this.updateById(seatId, updateSeatDto);

    const updateSeat = await this.findOneById(seatId, {
      relations: ['typeSeat']
    });

    if (!updateSeat) {
      throw new BadRequest(RESPONSE_MESSAGES.SEAT_NOT_FOUND);
    }

    return updateSeat;
  }

  async getAllSeatsByRoomId(roomId: string): Promise<Seat[]> {
    const existingRoom = await this.roomRepository.findOne({
      where: {
        id: roomId
      }
    });

    if (!existingRoom) {
      throw new BadRequest(RESPONSE_MESSAGES.ROOM_NOT_FOUND);
    }

    return await this.findAll({
      relations: ['typeSeat'],
      where: { roomId },
      order: { name: 'ASC' }
    });
  }

  async deleteSeat(seatId: string): Promise<void> {
    const seat = await this.findOneById(seatId, {
      relations: ['bookSeats']
    });

    if (!seat) {
      throw new BadRequest(RESPONSE_MESSAGES.SEAT_NOT_FOUND);
    }

    if (seat.bookSeats && seat.bookSeats.length > 0) {
      throw new ConflictException(RESPONSE_MESSAGES.SEAT_HAS_BOOKSEAT_CANNOT_DELETE);
    }

    await this.deleteById(seatId);
  }
}
