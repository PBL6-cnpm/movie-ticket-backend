import { BaseController } from '@bases/base-controller';
import { CurrentAccount } from '@common/decorators/current-account.decorator';
import { Public } from '@common/decorators/public.decorator';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { ContextUser } from '@common/types/user.type';
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
  Res
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentIntentDto } from '@shared/modules/stripe/dto/payment-intent.dto';
import { Request, Response } from 'express';
import { BookingPaymentService } from './booking-payment.service';
import { BookingService } from './booking.service';
import { CancelPaymentDto } from './dto/cancel-payment.dto';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import {
  ApplyRefreshmentsDto,
  ApplyVoucherDto,
  QueryHoldBookingAndroidPlatformDto,
  QueryHoldBookingDto
} from './dto/query-hold-booking.dto';

@Controller('bookings')
@ApiBearerAuth()
@ApiTags('Bookings')
export class BookingController extends BaseController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly paymentService: BookingPaymentService
  ) {
    super();
  }

  @Post('hold')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hold booking for selected seats' })
  async holdBooking(@Body() body: QueryHoldBookingDto, @CurrentAccount() user: ContextUser) {
    const result = await this.bookingService.holdBooking(body, user.id);
    return this.success(result);
  }

  @Post('create-payment-intent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create payment intent for booking' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment intent created successfully'
  })
  async createPaymentIntent(
    @CurrentAccount() account: ContextUser,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto
  ): Promise<SuccessResponse<PaymentIntentDto>> {
    const result = await this.paymentService.createPaymentIntent(
      createPaymentIntentDto,
      account.id
    );
    return this.success(result);
  }

  @Post('webhook')
  @Public()
  async handleWebhook(
    @Headers('stripe-signature') sig: string,
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response
  ) {
    await this.paymentService.handleStripeWebhook(sig, req.rawBody);
    res.status(HttpStatus.OK).send();
  }

  @Post('cancel-payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel payment for a booking' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment intent cancelled successfully'
  })
  async cancelPayment(
    @Body('bookingId') cancelPaymentDto: CancelPaymentDto
  ): Promise<SuccessResponse<void>> {
    await this.paymentService.cancelPayment(cancelPaymentDto.bookingId);
    return this.success(null);
  }

  @Post('hold/android-platform')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hold booking for selected seats on Android platform' })
  async holdBookingAndroid(
    @Body() body: QueryHoldBookingAndroidPlatformDto,
    @CurrentAccount() user: ContextUser
  ) {
    const result = await this.bookingService.holdBookingForAndroid(body, user.id);
    return this.success(result);
  }

  @Post('apply-refreshments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply refreshments to a pending booking' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Refreshments added successfully, booking total updated.'
  })
  async applyRefreshments(@Body() body: ApplyRefreshmentsDto, @CurrentAccount() user: ContextUser) {
    const result = await this.bookingService.addRefreshmentsToBooking(body, user.id);
    return this.success(result);
  }

  @Post('apply-voucher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply a voucher to a pending booking' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Voucher applied successfully, booking total updated.'
  })
  async applyVoucher(@Body() body: ApplyVoucherDto, @CurrentAccount() user: ContextUser) {
    const result = await this.bookingService.applyVoucherToBooking(body, user.id);
    return this.success(result);
  }

  @Public()
  @Post('ticket-qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get ticket QR code for a booking' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ticket QR code retrieved successfully'
  })
  async getTicketQrCode(): Promise<SuccessResponse<string>> {
    const result = await this.bookingService.getTicketQrCode();
    return this.success(result);
  }
}
