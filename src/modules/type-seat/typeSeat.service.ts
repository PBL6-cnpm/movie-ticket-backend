import { BaseService } from '@bases/base-service';
import { RESPONSE_MESSAGES } from '@common/constants';
import { BadRequest } from '@common/exceptions';
import { FilterPaginationOutput, PaginationDto } from '@common/types/pagination-base.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeSeat } from '@shared/db/entities/type-seat.entity';
import { Repository } from 'typeorm';
import { CreateTypeSeatDto } from './dto/create-type-seat.dto';
import { TypeSeatResponseDto } from './dto/type-seat-response.dto';
import { UpdateTypeSeatDto } from './dto/update-type-seat.dto';
@Injectable()
export class TypeSeatService extends BaseService<TypeSeat> {
  constructor(
    @InjectRepository(TypeSeat)
    private readonly typeSeatRepo: Repository<TypeSeat>
  ) {
    super(typeSeatRepo);
  }

  async getTypeSeatById(id: string): Promise<TypeSeatResponseDto> {
    const typeSeat = await this.findOneById(id);
    if (!typeSeat) {
      throw new BadRequest(RESPONSE_MESSAGES.TYPE_SEAT_NOT_FOUND);
    }
    return new TypeSeatResponseDto(typeSeat);
  }

  async getAllTypeSeats(dto: PaginationDto): Promise<FilterPaginationOutput<TypeSeatResponseDto>> {
    const { limit, offset } = dto;
    const [typeSeats, total] = await this.findAndCount({
      skip: offset,
      take: limit
    });

    const items = typeSeats.map((item) => new TypeSeatResponseDto(item));
    return {
      items,
      total
    };
  }

  async createTypeSeat(createTypeSeatDto: CreateTypeSeatDto): Promise<TypeSeatResponseDto> {
    const existingTypeSeat = await this.findOne({
      where: { name: createTypeSeatDto.name }
    });

    if (existingTypeSeat) {
      throw new BadRequest(RESPONSE_MESSAGES.TYPE_SEAT_NAME_EXISTS);
    }

    const typeSeat = await this.create(createTypeSeatDto);

    return new TypeSeatResponseDto(typeSeat);
  }

  async updateTypeSeat(
    id: string,
    updateTypeSeatDto: UpdateTypeSeatDto
  ): Promise<TypeSeatResponseDto> {
    const existingTypeSeat = await this.findOneById(id);
    if (!existingTypeSeat) {
      throw new BadRequest(RESPONSE_MESSAGES.TYPE_SEAT_NOT_FOUND);
    }

    // Check if updating name
    if (updateTypeSeatDto.name && updateTypeSeatDto.name !== existingTypeSeat.name) {
      const duplicated = await this.findOne({
        where: { name: updateTypeSeatDto.name }
      });

      if (duplicated) {
        throw new BadRequest(RESPONSE_MESSAGES.TYPE_SEAT_NAME_EXISTS);
      }
    }

    const updatedTypeSeat = await this.updateAndFindOneById(id, updateTypeSeatDto);

    return new TypeSeatResponseDto(updatedTypeSeat);
  }
}
