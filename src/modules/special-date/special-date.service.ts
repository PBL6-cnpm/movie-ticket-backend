import { BaseService } from '@bases/base-service';
import { RESPONSE_MESSAGES } from '@common/constants';
import { BadRequest, NotFound } from '@common/exceptions';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SpecialDate } from '@shared/db/entities/special-day.entity';
import { Repository } from 'typeorm';
import { CreateSpecialDateDto } from './dto/create-special-date.dto';
import { UpdateSpecialDateDto } from './dto/update-special-date.dto';

@Injectable()
export class SpecialDateService extends BaseService<SpecialDate> {
  constructor(
    @InjectRepository(SpecialDate)
    private readonly specialDateRepo: Repository<SpecialDate>
  ) {
    super(specialDateRepo);
  }

  async createSpecialDate(createSpecialDateDto: CreateSpecialDateDto): Promise<SpecialDate> {
    // Check if date already exists
    const existingSpecialDate = await this.findOne({
      where: { date: createSpecialDateDto.date }
    });

    if (existingSpecialDate) {
      throw new BadRequest(RESPONSE_MESSAGES.SPECIAL_DATE_ALREADY_EXISTS);
    }

    const specialDate = this.specialDateRepo.create(createSpecialDateDto);
    return this.specialDateRepo.save(specialDate);
  }

  async getAllSpecialDay(): Promise<SpecialDate[]> {
    return this.specialDateRepo.find();
  }

  async getSpecialDateById(id: string): Promise<SpecialDate> {
    const specialDate = await this.findOneById(id);

    if (!specialDate) {
      throw new NotFound(RESPONSE_MESSAGES.SPECIAL_DATE_NOT_FOUND);
    }

    return specialDate;
  }

  async updateSpecialDate(
    id: string,
    updateSpecialDateDto: UpdateSpecialDateDto
  ): Promise<SpecialDate> {
    const existingSpecialDate = await this.findOne({
      where: { id },
      relations: ['bookSeats']
    });

    if (!existingSpecialDate) {
      throw new NotFound(RESPONSE_MESSAGES.SPECIAL_DATE_NOT_FOUND);
    }

    if (existingSpecialDate.bookSeats.length > 0) {
      throw new BadRequest(RESPONSE_MESSAGES.SPECIAL_DATE_CANT_UPDATE_BE_USED);
    }

    await this.updateById(id, updateSpecialDateDto);

    const updatedSpecialDate = await this.findOneById(id);

    if (!updatedSpecialDate) {
      throw new NotFound(RESPONSE_MESSAGES.SPECIAL_DATE_NOT_FOUND);
    }

    return updatedSpecialDate;
  }

  async deleteSpecialDate(id: string): Promise<void> {
    const existingSpecialDate = await this.findOne({
      where: { id },
      relations: ['bookSeats']
    });

    if (!existingSpecialDate) {
      throw new NotFound(RESPONSE_MESSAGES.SPECIAL_DATE_NOT_FOUND);
    }

    if (existingSpecialDate.bookSeats.length > 0) {
      throw new BadRequest(RESPONSE_MESSAGES.SPECIAL_DATE_CANT_UPDATE_BE_USED);
    }

    await this.deleteById(id);
  }
}
