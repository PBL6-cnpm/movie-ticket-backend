import { BaseController } from '@bases/base-controller';
import { CurrentAccount } from '@common/decorators/current-account.decorator';
import { Public } from '@common/decorators/public.decorator';
import { SuccessResponse } from '@common/interfaces/api-response.interface';
import { ContextUser } from '@common/types/user.type';
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
  Res
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FirestoreService } from '@shared/modules/firebase/firestore.service';
import { PaymentIntentDto } from '@shared/modules/stripe/dto/payment-intent.dto';
import { Request, Response } from 'express';
import { BookingPaymentService } from './booking-payment.service';
import { BookingService } from './booking.service';
import { CancelPaymentDto } from './dto/cancel-payment.dto';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { QueryHoldBookingDto } from './dto/query-hold-booking.dto';

@Controller('bookings')
@ApiBearerAuth()
export class BookingController extends BaseController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly paymentService: BookingPaymentService,
    private readonly firestoreService: FirestoreService
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

  @Get('test-firestore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test writing to Firestore' })
  // @ApiExcludeEndpoint()
  @Public()
  async testFirestore() {
    try {
      await this.firestoreService.setDoc('test_collection', 'test_doc_from_controller', {
        message: 'Firestore test from BookingController',
        timestamp: new Date()
      });
      return this.success({
        status: 'OK',
        docId: 'test_doc_from_controller'
      });
    } catch (error) {
      console.error('Error writing to Firestore:', error);
      throw new Error('Failed to write to Firestore');
    }
  }
}
