import { BaseController } from '@bases/base-controller';
import { Public } from '@common/decorators/public.decorator';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckVoucherDto } from './dto/check-voucher.dto';
import { CheckedVoucherDto } from './dto/checked-voucher.dto';
import { PublicVoucherDto } from './dto/public-voucher.dto';
import { VoucherService } from './voucher.service';

@Controller('voucher')
@Public()
@ApiTags('Voucher')
export class VoucherController extends BaseController {
  constructor(private readonly voucherService: VoucherService) {
    super();
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
}
