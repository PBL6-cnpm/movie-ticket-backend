import { RESPONSE_MESSAGES } from '@common/constants';
import { BadRequest } from '@common/exceptions';
import { PaginationDto } from '@common/types/pagination-base.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Refreshments } from '@shared/db/entities/refreshments.entity';
import { CloudinaryService } from '@shared/modules/cloudinary/cloudinary.service';
import { Repository } from 'typeorm';
import { CreateRefreshmentDto } from './dto/create-refreshment.dto';
import { RefreshmentResponseDto } from './dto/refreshment-response.dto';
import { UpdateRefreshmentDto } from './dto/update-refreshment.dto';

@Injectable()
export class RefreshmentService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(Refreshments)
    private readonly refreshmentRepository: Repository<Refreshments>
  ) {}

  async createRefreshment(
    createReFreshmentDto: CreateRefreshmentDto,
    picture: Express.Multer.File
  ): Promise<RefreshmentResponseDto> {
    const existed = await this.refreshmentRepository.findOne({
      where: { name: createReFreshmentDto.name }
    });
    if (existed) {
      throw new BadRequest(RESPONSE_MESSAGES.REFRESHMENT_NAME_EXISTS);
    }
    let cloudUrl = '';
    if (picture) {
      cloudUrl = await this.cloudinaryService.uploadFileBuffer(picture);
    } else {
      throw new Error('Picture file is required');
    }

    const refreshment = this.refreshmentRepository.create({
      name: createReFreshmentDto.name,
      picture: cloudUrl,
      price: createReFreshmentDto.price,
      isCurrent: createReFreshmentDto.isCurrent
    });
    await this.refreshmentRepository.save(refreshment);

    const savedRefreshment = await this.refreshmentRepository.findOne({
      where: { id: refreshment.id }
    });

    return new RefreshmentResponseDto(savedRefreshment);
  }

  async updateRefreshment(
    id: string,
    updateRefreshmentDto: UpdateRefreshmentDto,
    picture?: Express.Multer.File
  ): Promise<RefreshmentResponseDto> {
    const refreshment = await this.refreshmentRepository.findOne({
      where: { id }
    });
    if (!refreshment) {
      throw new BadRequest(RESPONSE_MESSAGES.REFRESHMENT_NOT_FOUND);
    }

    if (updateRefreshmentDto.name && updateRefreshmentDto.name !== refreshment.name) {
      const nameExists = await this.refreshmentRepository.findOne({
        where: { name: updateRefreshmentDto.name }
      });
      if (nameExists) {
        throw new BadRequest(RESPONSE_MESSAGES.REFRESHMENT_NAME_EXISTS);
      }
    }
    let cloudUrl = refreshment.picture;
    if (picture) {
      const oldpicture = cloudUrl;
      cloudUrl = await this.cloudinaryService.uploadFileBuffer(picture);

      this.cloudinaryService
        .deleteFileByUrl(oldpicture)
        .catch((err) => console.warn('Failed to delete old image:', err.message || err));
    }

    Object.assign(refreshment, updateRefreshmentDto, { picture: cloudUrl });
    await this.refreshmentRepository.save(refreshment);

    return new RefreshmentResponseDto(refreshment);
  }

  async getAllRefreshments(
    dto: PaginationDto
  ): Promise<{ items: RefreshmentResponseDto[]; total: number }> {
    const { limit, offset } = dto;

    const [refreshments, total] = await this.refreshmentRepository.findAndCount({
      skip: offset,
      take: limit,
      order: { name: 'ASC' }
    });

    const items = refreshments.map((refreshment) => new RefreshmentResponseDto(refreshment));
    return { items, total };
  }

  async getRefreshmentById(id: string): Promise<RefreshmentResponseDto> {
    const refreshment = await this.refreshmentRepository.findOne({
      where: { id }
    });
    if (!refreshment) {
      throw new BadRequest(RESPONSE_MESSAGES.REFRESHMENT_NOT_FOUND);
    }
    return new RefreshmentResponseDto(refreshment);
  }

  async deleteRefreshment(id: string): Promise<void> {
    const refreshment = await this.refreshmentRepository.findOne({
      where: { id },
      relations: ['bookRefreshmentss']
    });

    if (!refreshment) {
      throw new BadRequest(RESPONSE_MESSAGES.REFRESHMENT_NOT_FOUND);
    }

    if (refreshment.bookRefreshmentss && refreshment.bookRefreshmentss.length > 0) {
      throw new BadRequest(RESPONSE_MESSAGES.REFRESHMENT_ALREADY_USED_IN_BOOKING);
    }

    if (refreshment.picture) {
      try {
        await this.cloudinaryService.deleteFileByUrl(refreshment.picture);
      } catch (error) {
        console.warn('Failed to delete picture on Cloudinary:', error.message);
      }
    }

    await this.refreshmentRepository.delete(id);
  }
}
