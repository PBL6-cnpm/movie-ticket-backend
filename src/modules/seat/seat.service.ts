import { BaseService } from '@bases/base-service';
import { RESPONSE_MESSAGES } from '@common/constants';
import { DayOfWeek } from '@common/enums';
import { BookingStatus } from '@common/enums/booking.enum';
import { BadRequest } from '@common/exceptions';
import { dayjsObjectWithTimezone, getStartAndEndOfDay } from '@common/utils/date.util';
import { getTypeSeatColor } from '@common/utils/seat.util';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from '@shared/db/entities/room.entity';
import { Seat } from '@shared/db/entities/seat.entity';
import { ShowTime } from '@shared/db/entities/show-time.entity';
import { SpecialDate } from '@shared/db/entities/special-date.entity';
import { TypeDay } from '@shared/db/entities/type-day.entity';
import { TypeSeat } from '@shared/db/entities/type-seat.entity';
import { RedisService } from '@shared/modules/redis/redis.service';
import { Between, Not, Repository } from 'typeorm';
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
    @InjectRepository(TypeDay)
    private readonly typeDayRepository: Repository<TypeDay>,
    @InjectRepository(SpecialDate)
    private readonly specialDateRepository: Repository<SpecialDate>,
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

  async getSeatsByRoom(roomId: string, showTime?: ShowTime): Promise<SeatByRoomResponseDto> {
    const showDate = dayjsObjectWithTimezone(showTime.timeStart).format('YYYY-MM-DD');
    console.log('Show Date (YYYY-MM-DD):', showDate);
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

    let additionalPrice = 0;

    if (showTime) {
      const { startOfDay, endOfDay } = getStartAndEndOfDay(showTime.timeStart);

      const specialDate = await this.specialDateRepository.findOne({
        where: { date: Between(new Date(startOfDay), new Date(endOfDay)) }
      });

      if (specialDate) {
        additionalPrice = specialDate.additionalPrice;
      } else {
        const dayOfWeekIndex = dayjsObjectWithTimezone(showTime.timeStart).day();
        const dayMap = {
          [DayOfWeek.MONDAY]: DayOfWeek.MONDAY,
          [DayOfWeek.TUESDAY]: DayOfWeek.TUESDAY,
          [DayOfWeek.WEDNESDAY]: DayOfWeek.WEDNESDAY,
          [DayOfWeek.THURSDAY]: DayOfWeek.THURSDAY,
          [DayOfWeek.FRIDAY]: DayOfWeek.FRIDAY,
          [DayOfWeek.SATURDAY]: DayOfWeek.SATURDAY,
          [DayOfWeek.SUNDAY]: DayOfWeek.SUNDAY
        };

        const dayOfWeekName = dayMap[dayOfWeekIndex];
        console.log(dayOfWeekName);
        if (dayOfWeekName) {
          const typeDay = await this.typeDayRepository.findOne({
            where: { dayOfWeek: dayOfWeekName }
          });

          if (typeDay) {
            additionalPrice = typeDay.additionalPrice;
          }
        }
      }
    }

    const allSeatsInfo: SeatInfoDto[] = seats.map((seat) => ({
      id: seat.id,
      name: seat.name,
      type: {
        id: seat.typeSeat.id,
        name: seat.typeSeat.name,
        price: seat.typeSeat.price + additionalPrice,
        color: getTypeSeatColor(seat.typeSeat.name)
      }
    }));

    const rowSet = new Set<string>();
    let maxCols = 0;
    seats.forEach((seat) => {
      const rowMatch = seat.name.match(/^([A-Z]+)/);
      const colMatch = seat.name.match(/(\d+)$/);
      if (rowMatch) rowSet.add(rowMatch[1]);
      if (colMatch) maxCols = Math.max(maxCols, parseInt(colMatch[1]));
    });

    const uniqueTypeSeats = [
      ...new Map(seats.map((seat) => [seat.typeSeat.id, seat.typeSeat])).values()
    ];
    const typeSeatList: TypeSeatInfo[] = uniqueTypeSeats.map((ts) => ({
      id: ts.id,
      name: ts.name,
      price: ts.price + additionalPrice,
      color: getTypeSeatColor(ts.name)
    }));

    const occupiedSeatEntities = showTime ? await this.getOccupiedSeats(showTime.id) : [];
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
      typeSeatList: typeSeatList
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
        statuses: [BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED, BookingStatus.PENDING]
      })
      .getMany();
  }

  async getSeatsByShowTime(showTimeId: string): Promise<SeatByRoomResponseDto> {
    const showTime = await this.showTimeRepository.findOne({
      where: { id: showTimeId }
    });

    if (!showTime) {
      throw new NotFoundException('ShowTime not found');
    }

    return this.getSeatsByRoom(showTime.roomId, showTime);
  }

  async getSeatSummaryByShowTime(
    showTimeId: string,
    roomId?: string
  ): Promise<{ totalSeats: number; availableSeats: number; occupiedSeats: number }> {
    let targetRoomId = roomId;

    if (!targetRoomId) {
      const showTime = await this.showTimeRepository.findOne({ where: { id: showTimeId } });

      if (!showTime) {
        throw new NotFoundException('ShowTime not found');
      }

      targetRoomId = showTime.roomId;
    }

    const totalSeats = await this.seatRepository.count({ where: { roomId: targetRoomId } });
    const occupiedSeatCount = (await this.getOccupiedSeats(showTimeId)).length;
    const availableSeats = Math.max(totalSeats - occupiedSeatCount, 0);

    return {
      totalSeats,
      availableSeats,
      occupiedSeats: occupiedSeatCount
    };
  }
}
