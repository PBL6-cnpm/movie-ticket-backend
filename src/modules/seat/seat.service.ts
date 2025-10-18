import { BaseService } from '@bases/base-service';
import { RESPONSE_MESSAGES } from '@common/constants';
import { BookingStatus } from '@common/enums/booking.enum';
import { BadRequest } from '@common/exceptions';
import { getTypeSeatColor } from '@common/utils/seat.util';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from '@shared/db/entities/room.entity';
import { Seat } from '@shared/db/entities/seat.entity';
import { ShowTime } from '@shared/db/entities/show-time.entity';
import { TypeSeat } from '@shared/db/entities/type-seat.entity';
import { RedisService } from '@shared/modules/redis/redis.service';
import { Not, Repository } from 'typeorm';
import { CreateSeatDto } from './dto/create-seat.dto';
import { SeatByRoomResponseDto, SeatInfoDto, TypeSeatInfo } from './dto/seat-by-room.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';

@Injectable()
export class SeatService extends BaseService<Seat> {
  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(TypeSeat)
    private readonly typeSeatRepository: Repository<TypeSeat>,
    @InjectRepository(ShowTime)
    private readonly showTimeRepository: Repository<ShowTime>,
    private readonly redisService: RedisService
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

  async getSeatsByRoom(roomId: string, showTimeId?: string): Promise<SeatByRoomResponseDto> {
    const seats = await this.seatRepository
      .createQueryBuilder('seat')
      .leftJoinAndSelect('seat.typeSeat', 'typeSeat')
      .leftJoinAndSelect('seat.room', 'room')
      .where('seat.roomId = :roomId', { roomId })
      .orderBy('seat.name', 'ASC')
      .getMany();

    if (!seats || seats.length === 0) {
      throw new NotFoundException(`Room with ID ${roomId} not found or has no seats.`);
    }

    const allSeatsInfo: SeatInfoDto[] = [];

    const typeSeatMap = new Map<string, TypeSeatInfo>();
    const rowSet = new Set<string>();
    let maxCols = 0;

    seats.forEach((seat) => {
      const seatInfo: SeatInfoDto = {
        id: seat.id,
        name: seat.name,
        type: {
          id: seat.typeSeat.id,
          name: seat.typeSeat.name,
          price: seat.typeSeat.price,
          color: getTypeSeatColor(seat.typeSeat.name)
        }
      };
      allSeatsInfo.push(seatInfo);

      if (!typeSeatMap.has(seat.typeSeat.id)) {
        typeSeatMap.set(seat.typeSeat.id, seatInfo.type);
      }

      const rowMatch = seat.name.match(/^([A-Z]+)/);
      const colMatch = seat.name.match(/(\d+)$/);
      if (rowMatch) rowSet.add(rowMatch[1]);
      if (colMatch) maxCols = Math.max(maxCols, parseInt(colMatch[1]));
    });

    const occupiedSeatEntities = showTimeId ? await this.getOccupiedSeats(showTimeId) : [];
    const occupiedSeatsResponse = occupiedSeatEntities.map((seat) => ({
      id: seat.id,
      name: seat.name
    }));

    const room = seats[0].room;
    const totalSeats = seats.length;
    const occupiedCount = occupiedSeatsResponse.length;
    const availableSeats = totalSeats - occupiedCount;

    return {
      roomId: room.id,
      roomName: room.name,
      seatLayout: {
        rows: Array.from(rowSet).sort(),
        cols: maxCols,
        occupiedSeats: occupiedSeatsResponse,
        seats: allSeatsInfo
      },
      totalSeats,
      availableSeats,
      occupiedSeats: occupiedCount,
      typeSeatList: Array.from(typeSeatMap.values())
    };
  }

  private async getOccupiedSeats(showTimeId: string): Promise<Seat[]> {
    return this.seatRepository
      .createQueryBuilder('seat')
      .innerJoin('seat.bookSeats', 'bookSeat')
      .innerJoin('bookSeat.booking', 'booking')
      .leftJoinAndSelect('seat.typeSeat', 'typeSeat')
      .where('booking.showTimeId = :showTimeId', { showTimeId })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
      })
      .getMany();
  }

  async getSeatsByShowTime(showTimeId: string): Promise<SeatByRoomResponseDto> {
    const showTime = await this.showTimeRepository.findOne({
      where: { id: showTimeId }
    });

    if (!showTime) {
      throw new Error('ShowTime not found');
    }

    return this.getSeatsByRoom(showTime.roomId, showTimeId);
  }
}
