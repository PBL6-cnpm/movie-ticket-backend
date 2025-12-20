import { BaseController } from '@bases/base-controller';
import { Permissions } from '@common/decorators/permissions.decorator';
import { Public } from '@common/decorators/public.decorator';
import { PermissionName } from '@common/enums';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { IPaginatedResponse, PaginationDto } from '@common/types/pagination-base.type';
import PaginationHelper from '@common/utils/pagination.util';
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckVoucherDto } from './dto/check-voucher.dto';
import { CheckedVoucherDto, CheckedVoucherWithFinalPriceDto } from './dto/checked-voucher.dto';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { PublicVoucherDto } from './dto/public-voucher.dto';
import { SearchVoucherDto } from './dto/search-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { VoucherResponseDto } from './dto/voucher-response.dto';
import { VoucherService } from './voucher.service';

@Controller('voucher')
@ApiTags('Voucher')
export class VoucherController extends BaseController {
  constructor(private readonly voucherService: VoucherService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Get all vouchers'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of all vouchers.',
    type: [VoucherResponseDto]
  })
  @Permissions(PermissionName.VOUCHER_READ)
  async getAllVouchers(
    @Query() dto: PaginationDto
  ): Promise<SuccessResponse<IPaginatedResponse<VoucherResponseDto>>> {
    const { items, total } = await this.voucherService.getAllVouchers(dto);
    const paginated = PaginationHelper.pagination({
      limit: dto.limit,
      offset: dto.offset,
      totalItems: total,
      items
    });
    return this.success(paginated);
  }

  @Post()
  @ApiOperation({ summary: 'Create new voucher' })
  @ApiResponse({
    status: 201,
    description: 'Voucher created successfully.',
    type: VoucherResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid data or voucher code already exists.' })
  @Permissions(PermissionName.VOUCHER_CREATE)
  async createVoucher(
    @Body() createVoucherDto: CreateVoucherDto
  ): Promise<SuccessResponse<VoucherResponseDto>> {
    const result = await this.voucherService.createVoucher(createVoucherDto);
    return this.success(result);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search vouchers',
    description: 'Search by code/name and filter by validity period, voucher type'
  })
  @ApiQuery({
    name: 'isPrivate',
    required: false,
    type: Boolean,
    description: 'Filter by voucher type: true = private, false = public, not provided = all'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of found vouchers.',
    type: [VoucherResponseDto]
  })
  @Permissions(PermissionName.VOUCHER_READ)
  async searchVouchers(
    @Query() paginationDto: PaginationDto,
    @Query() searchDto: SearchVoucherDto,
    @Query('isPrivate') isPrivate?: string
  ): Promise<SuccessResponse<IPaginatedResponse<VoucherResponseDto>>> {
    const isPrivateBoolean =
      isPrivate === 'true' ? true : isPrivate === 'false' ? false : undefined;
    const { items, total } = await this.voucherService.searchVouchers(
      paginationDto,
      searchDto,
      isPrivateBoolean
    );
    const paginated = PaginationHelper.pagination({
      limit: paginationDto.limit,
      offset: paginationDto.offset,
      totalItems: total,
      items
    });
    return this.success(paginated);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get a list of currently available public vouchers' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of public vouchers.',
    type: [PublicVoucherDto]
  })
  @Public()
  async getPublicVouchers(): Promise<SuccessResponse<PublicVoucherDto[]>> {
    const result = await this.voucherService.getPublicVouchers();
    return this.success(result);
  }

  @Post('check')
  @ApiOperation({ summary: 'Check the validity of a voucher code' })
  @ApiResponse({
    status: 200,
    description: 'Returns voucher details if valid.',
    type: CheckedVoucherDto
  })
  @ApiResponse({ status: 400, description: 'Voucher is out of stock or code is empty.' })
  @ApiResponse({ status: 404, description: 'Voucher code does not exist.' })
  @Public()
  async checkVoucher(
    @Body() checkVoucherDto: CheckVoucherDto
  ): Promise<SuccessResponse<CheckedVoucherDto>> {
    const result = await this.voucherService.checkVoucher(checkVoucherDto.code);
    return this.success(result);
  }

  @Post('bookings/:bookingId')
  @ApiOperation({ summary: 'Calculate booking price with voucher' })
  @ApiResponse({
    status: 200,
    description: 'Returns the final price after applying the voucher.',
    type: CheckedVoucherWithFinalPriceDto
  })
  @Permissions(PermissionName.VOUCHER_READ)
  async calculateBookingPriceWithVoucher(
    @Body() checkVoucherDto: CheckVoucherDto,
    @Param('bookingId') bookingId: string
  ): Promise<SuccessResponse<CheckedVoucherWithFinalPriceDto>> {
    const result = await this.voucherService.calculateBookingPriceWithVoucher(
      checkVoucherDto.code,
      bookingId
    );
    return this.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get voucher details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns voucher details.',
    type: VoucherResponseDto
  })
  @ApiResponse({ status: 404, description: 'Voucher not found.' })
  @Permissions(PermissionName.VOUCHER_READ)
  async getVoucherById(@Param('id') id: string): Promise<SuccessResponse<VoucherResponseDto>> {
    const result = await this.voucherService.getVoucherById(id);
    return this.success(result);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update voucher' })
  @ApiResponse({
    status: 200,
    description: 'Voucher updated successfully.',
    type: VoucherResponseDto
  })
  @ApiResponse({ status: 404, description: 'Voucher not found.' })
  @ApiResponse({ status: 400, description: 'Invalid data.' })
  @Permissions(PermissionName.VOUCHER_UPDATE)
  async updateVoucher(
    @Param('id') id: string,
    @Body() updateVoucherDto: UpdateVoucherDto
  ): Promise<SuccessResponse<VoucherResponseDto>> {
    const result = await this.voucherService.updateVoucher(id, updateVoucherDto);
    return this.success(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete voucher' })
  @ApiResponse({
    status: 200,
    description: 'Voucher deleted successfully.'
  })
  @Permissions(PermissionName.VOUCHER_DELETE)
  async deleteVoucher(@Param('id') id: string): Promise<SuccessResponse<null>> {
    await this.voucherService.deleteVoucher(id);
    return this.deleted();
  }
}
