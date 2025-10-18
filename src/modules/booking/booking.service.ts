import { HOLD_DURATION_SECONDS } from '@common/constants/booking.constant';
import { BookingStatus } from '@common/enums/booking.enum';
import { generateSeatLockKey } from '@common/utils/redis.util';
import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { BookSeat } from '@shared/db/entities/book-seat.entity';
import { Booking } from '@shared/db/entities/booking.entity';
import { Seat } from '@shared/db/entities/seat.entity';
import { RedisService } from '@shared/modules/redis/redis.service';
import { EntityManager } from 'typeorm';
import { QueryHoldBookingDto } from './dto/querry-hold-booking.dto';

@Injectable()
export class BookingService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly redisService: RedisService
  ) {}

  async holdBooking(dto: QueryHoldBookingDto, accountId: string) {
    const { seatIds, showTimeId } = dto;
    const lockedKeys: string[] = [];
    try {
      for (const seatId of seatIds) {
        const key = generateSeatLockKey(showTimeId, seatId);
        const result = await this.redisService.trySetNx(key, accountId, HOLD_DURATION_SECONDS);
        if (!result) {
          const takenSeatId = seatId;
          throw new ConflictException(`Seat ${takenSeatId} is already locked or booked.`);
        }

        lockedKeys.push(key);
      }

      const dbResult = await this.entityManager.transaction(async (transactionalEntityManager) => {
        const seats = await transactionalEntityManager.getRepository(Seat).find({
          where: seatIds.map((id) => ({ id }))
        });

        if (seats.length !== seatIds.length) {
          const notFoundSeats = seatIds.filter((id) => !seats.find((s) => s.id === id));
          throw new InternalServerErrorException(
            `Some seats not found: ${notFoundSeats.join(', ')}`
          );
        }

        const actualSeatIds = seats.map((seat) => seat.id);

        const existingBookSeats = await transactionalEntityManager
          .getRepository(BookSeat)
          .createQueryBuilder('bookSeat')
          .innerJoin(Booking, 'booking', 'booking.id = bookSeat.bookingId')
          .where('booking.showTimeId = :showTimeId', { showTimeId })
          .andWhere('bookSeat.seatId IN (:...actualSeatIds)', { actualSeatIds })
          .andWhere('booking.status IN (:...statuses)', {
            statuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
          })
          .getMany();
        if (existingBookSeats.length > 0) {
          throw new InternalServerErrorException(
            'Some seats are already booked. Please try again.'
          );
        }
        console.log('All seats are available, proceeding to create booking.', showTimeId, seatIds);
        const newBooking = transactionalEntityManager.create(Booking, {
          accountId,
          showTimeId,
          status: BookingStatus.PENDING,
          expiresAt: new Date(Date.now() + HOLD_DURATION_SECONDS * 1000),
          dateTimeBooking: new Date(),
          totalBookingPrice: 0 // TODO: Calculate total price
        });
        const savedBooking = await transactionalEntityManager.save(newBooking);

        const bookSeatsToCreate = actualSeatIds.map((seatId) =>
          transactionalEntityManager.create(BookSeat, {
            bookingId: savedBooking.id,
            seatId,
            status: false,
            totalSeatPrice: 0
          })
        );
        await transactionalEntityManager.save(bookSeatsToCreate);
        return {
          bookingId: savedBooking.id
          // expiresAt: savedBooking.expiresAt
        };
      });
      return { ...dbResult, message: 'Seats successfully held.' };
    } catch (error) {
      console.error('Transaction failed:', error);
      if (lockedKeys.length > 0) {
        await this.redisService.del(lockedKeys);
      }
      throw error;
    }
  }
}
