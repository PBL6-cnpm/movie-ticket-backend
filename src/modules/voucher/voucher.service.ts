import { RESPONSE_MESSAGES } from '@common/constants/response.constant';
import { PaginationDto } from '@common/types/pagination-base.type';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '@shared/db/entities/booking.entity';
import { Voucher } from '@shared/db/entities/voucher.entity';
import { IsNull, LessThanOrEqual, MoreThan, MoreThanOrEqual, Or, Repository } from 'typeorm';
import { CheckedVoucherDto, CheckedVoucherWithFinalPriceDto } from './dto/checked-voucher.dto';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { PublicVoucherDto } from './dto/public-voucher.dto';
import { SearchVoucherDto } from './dto/search-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { VoucherResponseDto } from './dto/voucher-response.dto';

@Injectable()
export class VoucherService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>
  ) {}

  async getAllVouchers(
    dto: PaginationDto
  ): Promise<{ items: VoucherResponseDto[]; total: number }> {
    const { limit, offset } = dto;

    const [vouchers, total] = await this.voucherRepository.findAndCount({
      where: {},
      order: { createdAt: 'DESC' },
      relations: ['bookings'],
      skip: offset,
      take: limit
    });

    const items = vouchers.map((voucher) => {
      const usedCount = voucher.bookings ? voucher.bookings.length : 0;
      return new VoucherResponseDto(voucher, usedCount);
    });

    return { items, total };
  }

  async searchVouchers(
    paginationDto: PaginationDto,
    searchDto: SearchVoucherDto,
    isPrivate?: boolean
  ): Promise<{ items: VoucherResponseDto[]; total: number }> {
    const { limit, offset } = paginationDto;
    const { keyword, validFromStart, validToEnd } = searchDto;

    const queryBuilder = this.voucherRepository
      .createQueryBuilder('voucher')
      .leftJoinAndSelect('voucher.bookings', 'bookings');

    // Lọc theo isPrivate
    if (isPrivate !== undefined) {
      queryBuilder.andWhere('voucher.isPrivate = :isPrivate', { isPrivate });
    }

    // Tìm kiếm theo keyword (code hoặc name)
    if (keyword && keyword.trim() !== '') {
      queryBuilder.andWhere('(voucher.code LIKE :keyword OR voucher.name LIKE :keyword)', {
        keyword: `%${keyword}%`
      });
    }

    // Lọc theo khoảng thời gian hiệu lực
    if (validFromStart) {
      queryBuilder.andWhere('(voucher.validFrom IS NULL OR voucher.validFrom >= :validFromStart)', {
        validFromStart
      });
    }

    if (validToEnd) {
      queryBuilder.andWhere('(voucher.validTo IS NULL OR voucher.validTo <= :validToEnd)', {
        validToEnd
      });
    }

    const [vouchers, total] = await queryBuilder
      .orderBy('voucher.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    const items = vouchers.map((voucher) => {
      const usedCount = voucher.bookings ? voucher.bookings.length : 0;
      return new VoucherResponseDto(voucher, usedCount);
    });

    return { items, total };
  }

  async getVoucherById(id: string): Promise<VoucherResponseDto> {
    const voucher = await this.voucherRepository.findOne({
      where: { id },
      relations: ['bookings']
    });

    if (!voucher) {
      throw new NotFoundException('Cannot find voucher.');
    }

    const usedCount = voucher.bookings ? voucher.bookings.length : 0;
    return new VoucherResponseDto(voucher, usedCount);
  }

  async createVoucher(createVoucherDto: CreateVoucherDto): Promise<VoucherResponseDto> {
    const existingVoucher = await this.voucherRepository.findOne({
      where: { code: createVoucherDto.code }
    });

    if (existingVoucher) {
      throw new BadRequestException('Voucher code already exists.');
    }

    // Validate logic: phải có ít nhất 1 loại giảm giá
    if (
      (!createVoucherDto.discountPercent || createVoucherDto.discountPercent === 0) &&
      (!createVoucherDto.discountValue || createVoucherDto.discountValue === 0)
    ) {
      throw new BadRequestException(
        'Voucher must have at least one type of discount (discountPercent or discountValue).'
      );
    }

    const voucher = this.voucherRepository.create({
      ...createVoucherDto,
      discountPercent: createVoucherDto.discountPercent ?? null,
      maxDiscountValue: createVoucherDto.maxDiscountValue ?? null,
      discountValue: createVoucherDto.discountValue ?? null,
      minimumOrderValue: createVoucherDto.minimumOrderValue ?? null,
      validFrom: createVoucherDto.validFrom ?? null,
      validTo: createVoucherDto.validTo ?? null,
      isPrivate: createVoucherDto.isPrivate ?? false
    });

    const savedVoucher = await this.voucherRepository.save(voucher);
    return new VoucherResponseDto(savedVoucher, 0);
  }

  async updateVoucher(id: string, updateVoucherDto: UpdateVoucherDto): Promise<VoucherResponseDto> {
    const voucher = await this.voucherRepository.findOne({
      where: { id },
      relations: ['bookings']
    });

    if (!voucher) {
      throw new NotFoundException('Không tìm thấy voucher.');
    }

    if (updateVoucherDto.code && updateVoucherDto.code !== voucher.code) {
      const existingVoucher = await this.voucherRepository.findOne({
        where: { code: updateVoucherDto.code }
      });

      if (existingVoucher) {
        throw new BadRequestException('Voucher code already exists.');
      }
    }

    if (
      updateVoucherDto.discountPercent !== null &&
      updateVoucherDto.maxDiscountValue === null &&
      voucher.maxDiscountValue == null
    ) {
      throw new BadRequestException(
        'maxDiscountValue is required when discountPercent is provided'
      );
    }

    Object.assign(voucher, updateVoucherDto);

    const updatedVoucher = await this.voucherRepository.save(voucher);
    const usedCount = updatedVoucher.bookings ? updatedVoucher.bookings.length : 0;

    return new VoucherResponseDto(updatedVoucher, usedCount);
  }

  async deleteVoucher(id: string): Promise<void> {
    const voucher = await this.voucherRepository.findOne({
      where: { id },
      relations: ['bookings']
    });

    if (!voucher) {
      throw new NotFoundException('Cannot find voucher.');
    }

    // Kiểm tra xem voucher có đang được sử dụng trong booking không
    const usedCount = voucher.bookings ? voucher.bookings.length : 0;

    if (usedCount > 0) {
      throw new BadRequestException(
        `Cannot delete this voucher because it is used in ${usedCount} bookings.`
      );
    }

    await this.voucherRepository.remove(voucher);
  }

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
