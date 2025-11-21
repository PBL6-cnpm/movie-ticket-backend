import { RESPONSE_MESSAGES } from '@common/constants/response.constant';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '@shared/db/entities/booking.entity';
import { Voucher } from '@shared/db/entities/voucher.entity';
import { IsNull, LessThanOrEqual, MoreThan, MoreThanOrEqual, Or, Repository } from 'typeorm';
import { CheckedVoucherDto, CheckedVoucherWithFinalPriceDto } from './dto/checked-voucher.dto';
import { PublicVoucherDto } from './dto/public-voucher.dto';

@Injectable()
export class VoucherService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>
  ) {}

  async getPublicVouchers(): Promise<PublicVoucherDto[]> {
    const now = new Date();

    const vouchers = await this.voucherRepository.find({
      where: {
        isPrivate: false,
        number: MoreThan(0),
        validFrom: Or(IsNull(), LessThanOrEqual(now)),
        validTo: Or(IsNull(), MoreThanOrEqual(now))
      },
      order: { createdAt: 'DESC' }
    });

    return vouchers.map((voucher) => new PublicVoucherDto(voucher));
  }

  async checkVoucher(code: string): Promise<CheckedVoucherDto> {
    if (!code || code.trim() === '') {
      throw new BadRequestException('Voucher code cannot be empty.');
    }

    const voucher = await this.voucherRepository.findOne({
      where: { code }
    });

    if (!voucher) {
      throw new NotFoundException('Invalid voucher code.');
    }

    if (voucher.number <= 0) {
      throw new BadRequestException('This voucher has run out.');
    }

    const now = new Date();
    if (voucher.validFrom && voucher.validFrom > now) {
      throw new BadRequestException('Voucher is not valid yet.');
    }
    if (voucher.validTo && voucher.validTo < now) {
      throw new BadRequestException('Voucher has expired.');
    }

    return new CheckedVoucherDto(voucher);
  }

  async calculateBookingPriceWithVoucher(
    code: string,
    bookingId: string
  ): Promise<CheckedVoucherWithFinalPriceDto> {
    const voucherDto = await this.checkVoucher(code);

    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['bookSeats', 'bookRefreshmentss']
    });

    if (!booking) {
      throw new NotFoundException(RESPONSE_MESSAGES.BOOKING_NOT_FOUND.message);
    }

    const seatTotal = (booking.bookSeats as Array<{ totalSeatPrice: number }>).reduce(
      (sum, seat) => sum + Number(seat.totalSeatPrice),
      0
    );
    const refreshmentTotal = (booking.bookRefreshmentss as Array<{ totalPrice: number }>).reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    const grossPrice = seatTotal + refreshmentTotal;

    if (voucherDto.minimumOrderValue && grossPrice < voucherDto.minimumOrderValue) {
      throw new BadRequestException(
        `Minimum order value required: ${voucherDto.minimumOrderValue}. Your total is: ${grossPrice}`
      );
    }

    let discountAmount = 0;

    if (voucherDto.discountPercent && voucherDto.discountPercent > 0) {
      discountAmount = Math.floor((grossPrice * voucherDto.discountPercent) / 100);

      if (voucherDto.maxDiscountValue && discountAmount > voucherDto.maxDiscountValue) {
        discountAmount = voucherDto.maxDiscountValue;
      }
    } else if (voucherDto.discountValue && voucherDto.discountValue > 0) {
      discountAmount = voucherDto.discountValue;
    }

    if (discountAmount > grossPrice) {
      discountAmount = grossPrice;
    }

    const finalPrice = grossPrice - discountAmount;

    return {
      finalPrice,
      code: voucherDto.code,
      price: grossPrice,
      voucherAmount: discountAmount
    };
  }
}
