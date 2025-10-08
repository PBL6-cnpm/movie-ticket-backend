import { BaseController } from '@bases/base-controller';
import { Public } from '@common/decorators/public.decorator';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { IPaginatedResponse, PaginationDto } from '@common/types/pagination-base.type';
import PaginationHelper from '@common/utils/pagination.util';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActorService } from './actor.service';
import { ActorResponseDto } from './dto/actor-response.dto';
import { CreateActorDto } from './dto/create-actor.dto';
import { UpdateActorDto } from './dto/update-actor.dto';

@Public()
@ApiTags('Actors')
@Controller('actors')
export class ActorController extends BaseController {
  constructor(private readonly actorService: ActorService) {
    super();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('picture'))
  @ApiOperation({ summary: 'Create a new actor' })
  @ApiConsumes('multipart/form-data')
  async createActor(
    @Body() createActorDto: CreateActorDto,
    @UploadedFile() picture: Express.Multer.File
  ): Promise<SuccessResponse<ActorResponseDto>> {
    const newActor = await this.actorService.createActor(createActorDto, picture);
    return this.created(newActor);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get actor by ID' })
  async getActorById(@Param('id') id: string): Promise<SuccessResponse<ActorResponseDto>> {
    const actor = await this.actorService.getActorById(id);
    return this.success(actor);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('picture'))
  @ApiOperation({ summary: 'Update actor by ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateActorDto })
  async updateActor(
    @Param('id') id: string,
    @Body() updateDto: UpdateActorDto,
    @UploadedFile() picture?: Express.Multer.File
  ): Promise<SuccessResponse<ActorResponseDto>> {
    const updated = await this.actorService.updateActor(id, updateDto, picture);
    return this.updated(updated);
  }

  @Get()
  @ApiOperation({ summary: 'Get all actors' })
  @HttpCode(HttpStatus.OK)
  async getAllActors(
    @Query() dto: PaginationDto
  ): Promise<SuccessResponse<IPaginatedResponse<ActorResponseDto>>> {
    const { items, total } = await this.actorService.getAllActors(dto);

    const paginated = PaginationHelper.pagination({
      limit: dto.limit,
      offset: dto.offset,
      totalItems: total,
      items
    });
    return this.success(paginated);
  }
}
