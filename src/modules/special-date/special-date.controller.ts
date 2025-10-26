import { BaseController } from '@bases/base-controller';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSpecialDateDto } from './dto/create-special-date.dto';
import { SpecialDateResponseDto } from './dto/special-date-response.dto';
import { UpdateSpecialDateDto } from './dto/update-special-date.dto';
import { SpecialDateService } from './special-date.service';

@ApiTags('Special Date')
@ApiBearerAuth()
@Controller('special-date')
export class SpecialDateController extends BaseController {
  constructor(private readonly specialDateService: SpecialDateService) {
    super();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new special date' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Special date created successfully',
    type: SpecialDateResponseDto
  })
  async createSpecialDate(@Body() dto: CreateSpecialDateDto) {
    console.log(dto.date);
    const specialDate = await this.specialDateService.createSpecialDate(dto);
    return this.created(new SpecialDateResponseDto(specialDate));
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all special dates' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Special dates retrieved successfully',
    type: [SpecialDateResponseDto]
  })
  async getAllSpecialDates() {
    const specialDates = await this.specialDateService.getAllSpecialDay();
    return this.success(specialDates.map((sd) => new SpecialDateResponseDto(sd)));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get special date by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Special date retrieved successfully',
    type: SpecialDateResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Special date not found'
  })
  async getSpecialDateById(@Param('id') id: string) {
    const specialDate = await this.specialDateService.getSpecialDateById(id);
    return this.success(new SpecialDateResponseDto(specialDate));
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update special date' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Special date updated successfully',
    type: SpecialDateResponseDto
  })
  async updateSpecialDate(@Param('id') id: string, @Body() dto: UpdateSpecialDateDto) {
    const specialDate = await this.specialDateService.updateSpecialDate(id, dto);
    return this.updated(new SpecialDateResponseDto(specialDate));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete special date' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Special date deleted successfully'
  })
  async deleteSpecialDate(@Param('id') id: string) {
    await this.specialDateService.deleteSpecialDate(id);
    return this.deleted();
  }
}
