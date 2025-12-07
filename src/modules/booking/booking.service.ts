import { RESPONSE_MESSAGES } from '@common/constants';
import { HOLD_DURATION_SECONDS } from '@common/constants/booking.constant';
import { DayOfWeek } from '@common/enums';
import { BookingStatus } from '@common/enums/booking.enum';
import { NotFound } from '@common/exceptions';
import { IPaginatedResponse, PaginationDto } from '@common/types/pagination-base.type';
import { ContextUser } from '@common/types/user.type';
import { dayjsObjectWithTimezone, getStartAndEndOfDay } from '@common/utils/date.util';
import { generateQRCodeAsMulterFile } from '@common/utils/generate-qr-code';
import PaginationHelper from '@common/utils/pagination.util';
import { generateSeatLockKey } from '@common/utils/redis.util';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Account } from '@shared/db/entities/account.entity';
import { BookRefreshments } from '@shared/db/entities/book-refreshments.entity';
import { BookSeat } from '@shared/db/entities/book-seat.entity';
import { Booking } from '@shared/db/entities/booking.entity';
import { Refreshments } from '@shared/db/entities/refreshments.entity';
import { Seat } from '@shared/db/entities/seat.entity';
import { ShowTime } from '@shared/db/entities/show-time.entity';
import { SpecialDate } from '@shared/db/entities/special-day.entity';
import { TypeDay } from '@shared/db/entities/type-day.entity';
import { Voucher } from '@shared/db/entities/voucher.entity';
import { CloudinaryService } from '@shared/modules/cloudinary/cloudinary.service';
import { RedisService } from '@shared/modules/redis/redis.service';
import { Between, EntityManager, In } from 'typeorm';
import { BookingResponseDto } from './dto/booking-response.dto';
import {
  AdditionalPriceDto,
  ApplyRefreshmentsDto,
  ApplyVoucherDto,
  CalculateRefreshmentsPriceResponseDto,
  PaymentConfirmationAndroidDto,
  QueryHoldBookingAndroidPlatformDto,
  QueryHoldBookingDto,
  RefreshmentItemDto
} from './dto/query-hold-booking.dto';

@Injectable()
export class BookingService {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,

    private readonly redisService: RedisService,

    private readonly cloudinaryService: CloudinaryService
  ) {}

  async handlePaymentConfirmationFromAndroid(body: PaymentConfirmationAndroidDto) {
    const { bookingId, refreshmentsOption, voucherCode } = body;

    try {
      const dbResult = await this.entityManager.transaction(async (tx) => {
        const booking = await tx.findOne(Booking, {
          where: { id: bookingId, status: BookingStatus.PENDING },
          relations: ['bookSeats'],
          lock: { mode: 'pessimistic_write' }
        });

        if (!booking) {
          throw new ConflictException('Booking not found, already processed, or expired.');
        }

        const { totalRefreshmentPrice, bookRefreshmentsToCreate } =
          await this._calculateRefreshments(tx, refreshmentsOption);

        if (bookRefreshmentsToCreate.length > 0) {
          bookRefreshmentsToCreate.forEach((br) => (br.booking = booking));
          await tx.save(BookRefreshments, bookRefreshmentsToCreate);
        }
        const totalSeatPrice = booking.totalBookingPrice;

        const grossTotalPrice = totalSeatPrice + totalRefreshmentPrice;

        let finalPrice = grossTotalPrice;
        let voucherId: string | null = null;

        if (voucherCode) {
          const voucherResult = await this._processVoucher(tx, voucherCode, grossTotalPrice);
          finalPrice = voucherResult.finalPrice;
          voucherId = voucherResult.voucherId;
        }

        booking.totalBookingPrice = finalPrice;
        booking.voucherId = voucherId;
        booking.dateTimeBooking = new Date();

        await tx.save(Booking, booking);

        await tx.update(BookSeat, { bookingId: booking.id }, { status: true });

        return {
          finalPrice: booking.totalBookingPrice
        };
      });

      return {
        bookingId: bookingId,
        totalPrice: dbResult.finalPrice,
        status: BookingStatus.PENDING_PAYMENT,
        message: 'Booking confirmed successfully.'
      };
    } catch (error) {
      console.error('Payment confirmation transaction failed:', error);
      throw error;
    }
  }

  async calculateRefreshmentsPrice(
    body: ApplyRefreshmentsDto
  ): Promise<CalculateRefreshmentsPriceResponseDto> {
    const { bookingId, refreshmentsOption } = body;
    const booking = await this.entityManager.getRepository(Booking).findOne({
      where: { id: bookingId, status: BookingStatus.PENDING }
    });
    if (!booking) {
      throw new NotFoundException('Pending booking not found.');
    }
    let totalRefreshmentsPrice = 0;
    if (refreshmentsOption && refreshmentsOption.length > 0) {
      const uniqueIds = refreshmentsOption.map((item) => item.refreshmentId);
      const refreshmentList = await this.entityManager.getRepository(Refreshments).find({
        where: {
          id: In(uniqueIds),
          isCurrent: true
        }
      });
      const priceMap = new Map<string, number>();
      refreshmentList.forEach((item) => priceMap.set(item.id, item.price));
      for (const item of refreshmentsOption) {
        const price = priceMap.get(item.refreshmentId);
        if (price === undefined) {
          throw new ConflictException(
            `Refreshment with ID ${item.refreshmentId} not found or is not available.`
          );
        }
        totalRefreshmentsPrice += price * item.quantity;
      }
    }

    const originalBookingTotal = booking.totalBookingPrice;
    const updatedBookingTotal = originalBookingTotal + totalRefreshmentsPrice;

    return {
      totalRefreshmentsPrice,
      refreshmentsOption,
      updatedBookingTotal,
      originalBookingTotal,
      bookingId
    };
  }

  async getBookingsByAccountId(
    accountId: string,
    dto: PaginationDto
  ): Promise<IPaginatedResponse<BookingResponseDto>> {
    const { limit, offset } = dto;
    const [bookings, total] = await this.entityManager.getRepository(Booking).findAndCount({
      where: {
        accountId: accountId,
        status: BookingStatus.CONFIRMED
      },
      relations: [
        'showTime',
        'showTime.movie',
        'showTime.room',
        'bookSeats',
        'bookSeats.seat',
        'bookSeats.seat.typeSeat',
        'bookSeats.seat.room',
        'bookRefreshmentss',
        'bookRefreshmentss.refreshments'
      ],
      order: {
        dateTimeBooking: 'DESC'
      },
      skip: offset,
      take: limit
    });

    const items = bookings.map((booking) => new BookingResponseDto(booking));

    const paginated = PaginationHelper.pagination({
      limit: dto.limit,
      offset: dto.offset,
      totalItems: total,
      items
    });

    return paginated;
  }

  async getBookingsByBranchId(
    account: ContextUser,
    dto: PaginationDto & { search?: string; date?: string; startDate?: string; endDate?: string }
  ): Promise<IPaginatedResponse<BookingResponseDto>> {
    const { limit, offset, search, date } = dto;
    const branchId = account.branchId;
    const queryBuilder = this.entityManager
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.showTime', 'showTime')
      .leftJoinAndSelect('showTime.movie', 'movie')
      .leftJoinAndSelect('showTime.room', 'room')
      .leftJoinAndSelect('booking.bookSeats', 'bookSeats')
      .leftJoinAndSelect('bookSeats.seat', 'seat')
      .leftJoinAndSelect('seat.typeSeat', 'typeSeat')
      .leftJoinAndSelect('seat.room', 'seatRoom')
      .leftJoinAndSelect('booking.bookRefreshmentss', 'bookRefreshmentss')
      .leftJoinAndSelect('bookRefreshmentss.refreshments', 'refreshments')
      .leftJoinAndSelect('booking.account', 'account')
      .leftJoinAndSelect('account.accountRoles', 'accountRoles')
      .leftJoinAndSelect('accountRoles.role', 'role')
      .leftJoinAndSelect('room.branch', 'branch')
      .where('branch.id = :branchId', { branchId })
      .orderBy('booking.dateTimeBooking', 'DESC')
      .skip(offset)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        '(booking.id LIKE :search OR account.phoneNumber LIKE :search OR account.fullName LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (date) {
      const { startOfDay, endOfDay } = getStartAndEndOfDay(date);
      queryBuilder.andWhere(
        'booking.dateTimeBooking >= :startOfDay AND booking.dateTimeBooking <= :endOfDay',
        {
          startOfDay,
          endOfDay
        }
      );
    } else if (dto.startDate && dto.endDate) {
      const { startOfDay } = getStartAndEndOfDay(dto.startDate);
      const { endOfDay } = getStartAndEndOfDay(dto.endDate);

      queryBuilder.andWhere(
        'booking.dateTimeBooking >= :startOfDay AND booking.dateTimeBooking <= :endOfDay',
        {
          startOfDay,
          endOfDay
        }
      );
    }

    const [bookings, total] = await queryBuilder.getManyAndCount();
    console.log('Bookings fetched for branch:', bookings.length);
    const items = bookings.map((booking) => new BookingResponseDto(booking));

    return PaginationHelper.pagination({
      limit: dto.limit,
      offset: dto.offset,
      totalItems: total,
      items
    });
  }

  async getTicketQrCode() {
    try {
      const qrBuffer = await generateQRCodeAsMulterFile('Thanh Thanh Va Va');

      const qrUrl = await this.cloudinaryService.uploadFileBuffer(qrBuffer);
      return qrUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new InternalServerErrorException('Failed to generate QR code');
    }
  }

  async holdBooking(dto: QueryHoldBookingDto, accountId: string) {
    const { seatIds, showTimeId, refreshmentsOption, phoneNumber } = dto;
    let bookingAccountId = accountId;

    if (phoneNumber) {
      const customerAccount = await this.entityManager.getRepository(Account).findOne({
        where: { phoneNumber }
      });

      if (!customerAccount) {
        throw new NotFoundException(`Customer with phone number ${phoneNumber} not found.`);
      }
      bookingAccountId = customerAccount.id;
    }

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
          relations: ['typeSeat']
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
        let totalRefreshmentPrice = 0;
        let bookRefreshmentsToCreate: BookRefreshments[] = [];

        ({ totalRefreshmentPrice, bookRefreshmentsToCreate } = await this._calculateRefreshments(
          transactionalEntityManager,
          refreshmentsOption
        ));
        calculatedTotalBookingPrice += totalRefreshmentPrice;

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
          accountId: bookingAccountId ?? accountId,
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

  async holdBookingForAndroid(dto: QueryHoldBookingAndroidPlatformDto, accountId: string) {
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
          relations: ['typeSeat']
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

        const finalBookingPrice = calculatedTotalBookingPrice;
        const voucherId: string | null = null;

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
  private async _calculateRefreshments(
    tx: EntityManager,
    refreshmentsOption: RefreshmentItemDto[]
  ): Promise<{ totalRefreshmentPrice: number; bookRefreshmentsToCreate: BookRefreshments[] }> {
    const bookRefreshmentsToCreate: BookRefreshments[] = [];
    let totalRefreshmentPrice = 0;

    if (refreshmentsOption && refreshmentsOption.length > 0) {
      const uniqueIds = refreshmentsOption.map((item) => item.refreshmentId);
      const refreshmentList = await tx.getRepository(Refreshments).find({
        where: {
          id: In(uniqueIds),
          isCurrent: true
        }
      });

      const priceMap = new Map<string, number>();
      refreshmentList.forEach((item) => priceMap.set(item.id, item.price));

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
          tx.create(BookRefreshments, {
            refreshmentsId: item.refreshmentId,
            quantity: item.quantity,
            totalPrice: itemTotalPrice
          })
        );
      }
    }
    return { totalRefreshmentPrice, bookRefreshmentsToCreate };
  }

  async addRefreshmentsToBooking(dto: ApplyRefreshmentsDto, accountId: string) {
    return this.entityManager.transaction(async (transactionalEntityManager) => {
      const booking = await transactionalEntityManager.findOne(Booking, {
        where: { id: dto.bookingId, accountId: accountId, status: BookingStatus.PENDING }
      });
      if (!booking) {
        throw new NotFoundException('Pending booking not found for this account.');
      }

      if (booking.voucherId) {
        throw new ConflictException('Cannot add refreshments after a voucher has been applied.');
      }

      const { totalRefreshmentPrice, bookRefreshmentsToCreate } = await this._calculateRefreshments(
        transactionalEntityManager,
        dto.refreshmentsOption
      );

      if (totalRefreshmentPrice === 0) {
        return booking;
      }

      booking.totalBookingPrice += totalRefreshmentPrice;

      bookRefreshmentsToCreate.forEach((bookRef) => (bookRef.bookingId = booking.id));
      await transactionalEntityManager.save(BookRefreshments, bookRefreshmentsToCreate);

      await transactionalEntityManager.save(Booking, booking);

      return booking;
    });
  }

  async applyVoucherToBooking(dto: ApplyVoucherDto, accountId: string) {
    return this.entityManager.transaction(async (transactionalEntityManager) => {
      const booking = await transactionalEntityManager.findOne(Booking, {
        where: { id: dto.bookingId, accountId: accountId, status: BookingStatus.PENDING },
        relations: ['bookSeats', 'bookRefreshmentss'] // Load các mục đã thêm
      });

      if (!booking) {
        throw new NotFoundException('Pending booking not found for this account.');
      }

      if (booking.voucherId) {
        throw new ConflictException('A voucher has already been applied to this booking.');
      }

      const grossSeatPrice = booking.bookSeats.reduce((sum, seat) => sum + seat.totalSeatPrice, 0);
      const grossRefreshmentPrice = booking.bookRefreshmentss.reduce(
        (sum, ref) => sum + (ref.totalPrice || 0),
        0
      );
      const grossTotalPrice = grossSeatPrice + grossRefreshmentPrice;

      const voucherResult = await this._processVoucher(
        transactionalEntityManager,
        dto.voucherCode,
        grossTotalPrice
      );

      booking.totalBookingPrice = voucherResult.finalPrice;
      booking.voucherId = voucherResult.voucherId;

      await transactionalEntityManager.save(Booking, booking);

      return booking;
    });
  }

  async checkInBooking(bookingId: string): Promise<BookingResponseDto> {
    console.log('Checking in booking with ID:', bookingId);
    const booking = await this.entityManager.getRepository(Booking).findOne({
      where: {
        id: bookingId,
        status: BookingStatus.CONFIRMED
      },
      relations: [
        'showTime',
        'showTime.movie',
        'showTime.room',
        'bookSeats',
        'bookSeats.seat',
        'bookSeats.seat.typeSeat',
        'bookSeats.seat.room',
        'bookRefreshmentss',
        'bookRefreshmentss.refreshments'
      ]
    });
    if (!booking) {
      throw new NotFound(RESPONSE_MESSAGES.BOOKING_CHECKIN_ERROR);
    }
    booking.checkInStatus = true;
    await this.entityManager.getRepository(Booking).save(booking);

    return new BookingResponseDto(booking);
  }
}
