import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Voucher } from '@shared/db/entities/voucher.entity';
import { IsNull, LessThanOrEqual, MoreThan, MoreThanOrEqual, Or, Repository } from 'typeorm';
import { CheckedVoucherDto } from './dto/checked-voucher.dto';
import { PublicVoucherDto } from './dto/public-voucher.dto';

@Injectable()
export class VoucherService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>
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
}
