import { HOLD_DURATION_SECONDS } from '@common/constants/booking.constant';
import { DayOfWeek } from '@common/enums';
import { BookingStatus } from '@common/enums/booking.enum';
import { dayjsObjectWithTimezone, getStartAndEndOfDay } from '@common/utils/date.util';
import { generateSeatLockKey } from '@common/utils/redis.util';
import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { BookRefreshments } from '@shared/db/entities/book-refreshments.entity';
import { BookSeat } from '@shared/db/entities/book-seat.entity';
import { Booking } from '@shared/db/entities/booking.entity';
import { Refreshments } from '@shared/db/entities/refreshments.entity';
import { Seat } from '@shared/db/entities/seat.entity';
import { ShowTime } from '@shared/db/entities/show-time.entity';
import { SpecialDate } from '@shared/db/entities/special-day.entity';
import { TypeDay } from '@shared/db/entities/type-day.entity';
import { Voucher } from '@shared/db/entities/voucher.entity';
import { RedisService } from '@shared/modules/redis/redis.service';
import { Between, EntityManager, In } from 'typeorm';
import { AdditionalPriceDto, QueryHoldBookingDto } from './dto/query-hold-booking.dto';

@Injectable()
export class BookingService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,

    private readonly redisService: RedisService
  ) {}

  async holdBooking(dto: QueryHoldBookingDto, accountId: string) {
    const { seatIds, showTimeId, refreshmentsOption } = dto;
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
      // get showtime to calculate additional price
      const showTime = await this.entityManager.getRepository(ShowTime).findOne({
        where: { id: showTimeId }
      });
      if (!showTime) {
        throw new InternalServerErrorException('Showtime not found');
      }

      const dbResult = await this.entityManager.transaction(async (transactionalEntityManager) => {
        const seats = await transactionalEntityManager.getRepository(Seat).find({
          where: seatIds.map((id) => ({ id })),
          relations: ['typeSeat'],
          select: ['id', 'typeSeat']
        });

        if (seats.length !== seatIds.length) {
          const notFoundSeats = seatIds.filter((id) => !seats.find((s) => s.id === id));
          throw new InternalServerErrorException(
            `Some seats not found: ${notFoundSeats.join(', ')}`
          );
        }

        const existingBookSeats = await transactionalEntityManager
          .getRepository(BookSeat)
          .createQueryBuilder('bookSeat')
          .innerJoin(Booking, 'booking', 'booking.id = bookSeat.bookingId')
          .where('booking.showTimeId = :showTimeId', { showTimeId })
          .andWhere('bookSeat.seatId IN (:...actualSeatIds)', { actualSeatIds: seatIds })
          .getMany();
        if (existingBookSeats.length > 0) {
          throw new InternalServerErrorException(
            'Some seats are already booked. Please try again.'
          );
        }
        let calculatedTotalBookingPrice = 0;
        const bookSeatsToCreate: BookSeat[] = [];

        //calculate additional price with special date and type day
        const additionalResult = await this._getAdditionalPrice(
          this.entityManager,
          showTime.timeStart
        );

        for (const seat of seats) {
          if (!seat.typeSeat) {
            throw new InternalServerErrorException(`Seat ${seat.id} is missing TypeSeat relation.`);
          }

          const seatPrice = seat.typeSeat.price + additionalResult.additionalPrice;

          calculatedTotalBookingPrice += seatPrice;

          bookSeatsToCreate.push(
            transactionalEntityManager.create(BookSeat, {
              seatId: seat.id,
              status: false,
              typeDayId: additionalResult.additionalTypeDayId || null,
              specialDateId: additionalResult.additionalSpecialDateId || null,
              totalSeatPrice: seatPrice
            })
          );
        }

        const bookRefreshmentsToCreate: BookRefreshments[] = [];
        if (refreshmentsOption && refreshmentsOption.length > 0) {
          const uniqueIds = refreshmentsOption.map((item) => item.refreshmentId);
          const refreshmentList = await transactionalEntityManager
            .getRepository(Refreshments)
            .find({
              where: {
                id: In(uniqueIds),
                isCurrent: true
              }
            });

          const priceMap = new Map<string, number>();
          refreshmentList.forEach((item) => priceMap.set(item.id, item.price));

          let totalRefreshmentPrice = 0;
          for (const item of refreshmentsOption) {
            const price = priceMap.get(item.refreshmentId);

            if (price === undefined) {
              throw new ConflictException(
                `Refreshment with ID ${item.refreshmentId} not found or is not available.`
              );
            }

            const itemTotalPrice = price * item.quantity;
            totalRefreshmentPrice += itemTotalPrice;

            bookRefreshmentsToCreate.push(
              transactionalEntityManager.create(BookRefreshments, {
                refreshmentsId: item.refreshmentId,
                quantity: item.quantity,
                totalPrice: itemTotalPrice
              })
            );
          }
          calculatedTotalBookingPrice += totalRefreshmentPrice;
        }

        let finalBookingPrice = calculatedTotalBookingPrice;
        let voucherId: string | null = null;
        if (dto.voucherCode) {
          const voucherResult = await this._processVoucher(
            transactionalEntityManager,
            dto.voucherCode,
            calculatedTotalBookingPrice
          );

          finalBookingPrice = voucherResult.finalPrice;
          voucherId = voucherResult.voucherId;
        }
        const newBooking = transactionalEntityManager.create(Booking, {
          accountId,
          showTimeId,
          status: BookingStatus.PENDING,
          expiresAt: new Date(Date.now() + HOLD_DURATION_SECONDS * 1000),
          dateTimeBooking: new Date(),
          totalBookingPrice: finalBookingPrice,
          voucherId: voucherId
        });
        const savedBooking = await transactionalEntityManager.save(newBooking);

        bookSeatsToCreate.forEach((bookSeat) => {
          bookSeat.bookingId = savedBooking.id;
        });
        await transactionalEntityManager.save(bookSeatsToCreate);

        if (bookRefreshmentsToCreate.length > 0) {
          bookRefreshmentsToCreate.forEach((bookRef) => {
            bookRef.bookingId = savedBooking.id;
          });
          await transactionalEntityManager.save(BookRefreshments, bookRefreshmentsToCreate);
        }

        return {
          bookingId: savedBooking.id,
          totalPrice: savedBooking.totalBookingPrice
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

  private async _getAdditionalPrice(
    entityManager: EntityManager,
    showTimeStart: Date
  ): Promise<AdditionalPriceDto> {
    const { startOfDay, endOfDay } = getStartAndEndOfDay(showTimeStart);

    const specialDate = await entityManager.getRepository(SpecialDate).findOne({
      where: { date: Between(new Date(startOfDay), new Date(endOfDay)) }
    });

    if (specialDate) {
      return {
        additionalPrice: specialDate.additionalPrice,
        additionalSpecialDateId: specialDate.id
      };
    }

    const dayOfWeekIndex = dayjsObjectWithTimezone(showTimeStart).day();
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
    if (dayOfWeekName) {
      const typeDay = await entityManager.getRepository(TypeDay).findOne({
        where: { dayOfWeek: dayOfWeekName }
      });

      if (typeDay) {
        return {
          additionalPrice: typeDay.additionalPrice,
          additionalTypeDayId: typeDay.id
        };
      }
    }

    return {
      additionalPrice: 0,
      additionalTypeDayId: null
    };
  }

  private async _processVoucher(
    tx: EntityManager,
    voucherCode: string,
    totalAmount: number
  ): Promise<{ finalPrice: number; voucherId: string }> {
    const voucher = await tx.getRepository(Voucher).findOne({
      where: { code: voucherCode }
    });

    if (!voucher) {
      throw new ConflictException('Voucher code does not exist.');
    }
    if (voucher.number <= 0) {
      throw new ConflictException('Voucher is out of stock.');
    }
    if (voucher.minimumOrderValue && totalAmount < voucher.minimumOrderValue) {
      throw new ConflictException(
        `Minimum order value required: ${voucher.minimumOrderValue}. Your total is: ${totalAmount}`
      );
    }

    const now = new Date();
    const isTimeLimited = voucher.validFrom && voucher.validTo;

    if (isTimeLimited && (now < voucher.validFrom || now > voucher.validTo)) {
      throw new ConflictException('Voucher is expired or not yet valid.');
    }

    const discountAmount = this._calculateDiscount(voucher, totalAmount);
    const finalPrice = Math.max(0, totalAmount - discountAmount);

    voucher.number -= 1;
    await tx.save(Voucher, voucher);

    return { finalPrice, voucherId: voucher.id };
  }

  private _calculateDiscount(voucher: Voucher, totalAmount: number): number {
    let discountAmount = 0;

    if (voucher.discountPercent && voucher.discountPercent > 0) {
      discountAmount = totalAmount * (voucher.discountPercent / 100);
      if (voucher.maxDiscountValue && discountAmount > voucher.maxDiscountValue) {
        discountAmount = voucher.maxDiscountValue;
      }
    } else if (voucher.discountValue && voucher.discountValue > 0) {
      discountAmount = voucher.discountValue;
    }

    return discountAmount;
  }
}
