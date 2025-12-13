import { BaseController } from '@bases/base-controller';
import { Public } from '@common/decorators/public.decorator';
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
@Public()
@ApiTags('Voucher')
export class VoucherController extends BaseController {
  constructor(private readonly voucherService: VoucherService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách tất cả vouchers (Super Admin)'
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách tất cả vouchers.',
    type: [VoucherResponseDto]
  })
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
  @ApiOperation({ summary: 'Tạo voucher mới (Super Admin)' })
  @ApiResponse({
    status: 201,
    description: 'Voucher đã được tạo thành công.',
    type: VoucherResponseDto
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc mã voucher đã tồn tại.' })
  async createVoucher(
    @Body() createVoucherDto: CreateVoucherDto
  ): Promise<SuccessResponse<VoucherResponseDto>> {
    const result = await this.voucherService.createVoucher(createVoucherDto);
    return this.success(result);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Tìm kiếm vouchers (Super Admin)',
    description: 'Tìm kiếm theo code/name và lọc theo khoảng thời gian hiệu lực, loại voucher'
  })
  @ApiQuery({
    name: 'isPrivate',
    required: false,
    type: Boolean,
    description: 'Lọc theo loại voucher: true = private, false = public, không truyền = tất cả'
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách vouchers tìm được.',
    type: [VoucherResponseDto]
  })
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
  @ApiOperation({ summary: 'Lấy thông tin chi tiết voucher theo ID (Super Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin chi tiết voucher.',
    type: VoucherResponseDto
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy voucher.' })
  async getVoucherById(@Param('id') id: string): Promise<SuccessResponse<VoucherResponseDto>> {
    const result = await this.voucherService.getVoucherById(id);
    return this.success(result);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật voucher (Super Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Voucher đã được cập nhật thành công.',
    type: VoucherResponseDto
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy voucher.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  async updateVoucher(
    @Param('id') id: string,
    @Body() updateVoucherDto: UpdateVoucherDto
  ): Promise<SuccessResponse<VoucherResponseDto>> {
    const result = await this.voucherService.updateVoucher(id, updateVoucherDto);
    return this.success(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa voucher (Super Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Voucher đã được xóa thành công.'
  })
  async deleteVoucher(@Param('id') id: string): Promise<SuccessResponse<null>> {
    await this.voucherService.deleteVoucher(id);
    return this.deleted();
  }
}
