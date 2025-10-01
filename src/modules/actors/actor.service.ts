import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { BadRequest } from '@common/exceptions/bad-request.exception';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Actor } from 'shared/db/entities/actor.entity';
import { CloudinaryService } from 'shared/modules/cloudinary/cloudinary.service';
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
    const existingActor = await this.actorRepo.findOne({ where: { name: createRequest.name } });
    if (existingActor) {
      throw new Error(`Actor with name ${createRequest.name} already exists`);
    }

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
    const actor = await this.actorRepo.findOne({ where: { id } });
    if (!actor) throw new BadRequest(RESPONSE_MESSAGES.ACTOR_NOT_FOUND);

    // Nếu đổi tên, kiểm tra trùng
    if (updateDto.name && updateDto.name !== actor.name) {
      const duplicate = await this.actorRepo.findOne({ where: { name: updateDto.name } });
      if (duplicate) {
        throw new BadRequest(RESPONSE_MESSAGES.ACTOR_NAME_EXISTS);
      }
    }

    let cloudUrl = actor.picture;
    if (picture) {
      cloudUrl = await this.cloudinaryService.uploadFileBuffer(picture);
    }

    Object.assign(actor, updateDto, { picture: cloudUrl });
    await this.actorRepo.save(actor);

    const updated = await this.actorRepo.findOne({
      where: { id: actor.id },
      relations: ['movieActors', 'movieActors.movie']
    });

    return new ActorResponseDto(updated);
  }
}
