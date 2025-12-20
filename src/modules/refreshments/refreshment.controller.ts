import { BaseController } from '@bases/base-controller';
import { Permissions } from '@common/decorators/permissions.decorator';
import { Public } from '@common/decorators/public.decorator';
import { PermissionName } from '@common/enums';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { IPaginatedResponse, PaginationDto } from '@common/types/pagination-base.type';
import PaginationHelper from '@common/utils/pagination.util';
import {
  Body,
  Controller,
  Delete,
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
import { CreateRefreshmentDto } from './dto/create-refreshment.dto';
import { RefreshmentResponseDto } from './dto/refreshment-response.dto';
import { UpdateRefreshmentDto } from './dto/update-refreshment.dto';
import { RefreshmentService } from './refreshment.service';

@Controller('refreshments')
@ApiTags('Refreshments')
export class RefreshmentController extends BaseController {
  constructor(private readonly refreshmentService: RefreshmentService) {
    super();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('picture'))
  @ApiOperation({ summary: 'Create a new refreshment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        picture: { type: 'string', format: 'binary' },
        price: { type: 'number' },
        isCurrent: { type: 'boolean' }
      }
    }
  })
  @Permissions(PermissionName.REFRESHMENTS_CREATE)
  async createRefreshment(
    @Body() createReFreshmentDto: CreateRefreshmentDto,
    @UploadedFile() picture: Express.Multer.File
  ): Promise<SuccessResponse<RefreshmentResponseDto>> {
    const newRefreshment = await this.refreshmentService.createRefreshment(
      createReFreshmentDto,
      picture
    );
    return this.success(newRefreshment);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('picture'))
  @ApiOperation({ summary: 'Update a refreshment by ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        picture: { type: 'string', format: 'binary' },
        price: { type: 'number' },
        isCurrent: { type: 'boolean' }
      }
    }
  })
  @Permissions(PermissionName.REFRESHMENTS_UPDATE)
  async updateRefreshment(
    @Param('id') id: string,
    @Body() updateRefreshmentDto: UpdateRefreshmentDto,
    @UploadedFile() picture?: Express.Multer.File
  ): Promise<SuccessResponse<RefreshmentResponseDto>> {
    const updatedRefreshment = await this.refreshmentService.updateRefreshment(
      id,
      updateRefreshmentDto,
      picture
    );
    return this.updated(updatedRefreshment);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all refreshments' })
  @Public()
  async getAllRefreshments(
    @Query() dto: PaginationDto
  ): Promise<SuccessResponse<IPaginatedResponse<RefreshmentResponseDto>>> {
    const { items, total } = await this.refreshmentService.getAllRefreshments(dto);

    const paginated = PaginationHelper.pagination({
      limit: dto.limit,
      offset: dto.offset,
      totalItems: total,
      items
    });
    return this.success(paginated);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get refreshment by ID' })
  @Public()
  async getRefreshmentById(
    @Param('id') id: string
  ): Promise<SuccessResponse<RefreshmentResponseDto>> {
    const refreshment = await this.refreshmentService.getRefreshmentById(id);
    return this.success(refreshment);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a refreshment by ID' })
  @Permissions(PermissionName.REFRESHMENTS_DELETE)
  async deleteRefreshment(@Param('id') id: string): Promise<SuccessResponse<null>> {
    await this.refreshmentService.deleteRefreshment(id);
    return this.deleted();
  }
}
