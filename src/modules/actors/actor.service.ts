import { RESPONSE_MESSAGES } from '@common/constants';
import { BadRequest } from '@common/exceptions/bad-request.exception';
import { PaginationDto } from '@common/types/pagination-base.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor } from '@shared/db/entities/actor.entity';
import { CloudinaryService } from '@shared/modules/cloudinary/cloudinary.service';
import { Repository } from 'typeorm';
import { ActorResponseDto } from './dto/actor-response.dto';
import { CreateActorDto } from './dto/create-actor.dto';
import { UpdateActorDto } from './dto/update-actor.dto';

@Injectable()
export class ActorService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(Actor)
    private readonly actorRepo: Repository<Actor>
  ) {}

  async createActor(
    createRequest: CreateActorDto,
    picture?: Express.Multer.File
  ): Promise<ActorResponseDto> {
    let cloudUrl = '';
    if (picture) {
      cloudUrl = await this.cloudinaryService.uploadFileBuffer(picture);
    } else {
      throw new Error('Picture file is required');
    }

    const actor = this.actorRepo.create({
      name: createRequest.name,
      description: createRequest.description,
      picture: cloudUrl
    });
    await this.actorRepo.save(actor);

    const savedActor = await this.actorRepo.findOne({
      where: { id: actor.id },
      relations: ['movieActors', 'movieActors.movie']
    });

    return new ActorResponseDto(savedActor);
  }

  async getActorById(id: string): Promise<ActorResponseDto> {
    const actor = await this.actorRepo.findOne({
      where: { id },
      relations: ['movieActors', 'movieActors.movie']
    });
    if (!actor) throw new BadRequest(RESPONSE_MESSAGES.ACTOR_NOT_FOUND);
    return new ActorResponseDto(actor);
  }

  async updateActor(
    id: string,
    updateDto: UpdateActorDto,
    picture?: Express.Multer.File
  ): Promise<ActorResponseDto> {
    const actor = await this.actorRepo.findOne({
      where: { id },
      relations: ['movieActors', 'movieActors.movie']
    });
    if (!actor) throw new BadRequest(RESPONSE_MESSAGES.ACTOR_NOT_FOUND);

    let cloudUrl = actor.picture;
    if (picture) {
      const oldpicture = cloudUrl;
      cloudUrl = await this.cloudinaryService.uploadFileBuffer(picture);

      this.cloudinaryService
        .deleteFileByUrl(oldpicture)
        .catch((err) => console.warn('Failed to delete old image:', err.message || err));
    }

    Object.assign(actor, updateDto, { picture: cloudUrl });
    await this.actorRepo.save(actor);

    return new ActorResponseDto(actor);
  }

  async getAllActors(dto: PaginationDto): Promise<{ items: ActorResponseDto[]; total: number }> {
    const { limit, offset } = dto;

    const [actors, total] = await this.actorRepo.findAndCount({
      skip: offset,
      take: limit,
      relations: ['movieActors', 'movieActors.movie'],
      order: { name: 'ASC' }
    });

    const items = actors.map((a) => new ActorResponseDto(a));
    return { items, total };
  }
}
