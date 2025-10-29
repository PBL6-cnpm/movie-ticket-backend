import { JOB_TYPES, QUEUE_KEY, RESPONSE_MESSAGES } from '@common/constants';
import { PAYMENT_EXPIRATION_MILLISECONDS } from '@common/constants/stripe.constant';
import { BookingStatus } from '@common/enums/booking.enum';
import { BadRequest } from '@common/exceptions';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '@shared/db/entities/booking.entity';
import { PaymentIntentDto } from '@shared/modules/stripe/dto/payment-intent.dto';
import { StripeService } from '@shared/modules/stripe/stripe.service';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class BookingPaymentService {
  constructor(
    @InjectQueue(QUEUE_KEY.cancelExpiredPayment) private readonly cancelExpiredPaymentQueue: Queue,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,

    private readonly stripeService: StripeService
  ) {}

  async createPaymentIntent(
    createPaymentIntentDto: CreatePaymentIntentDto,
    accountId: string
  ): Promise<PaymentIntentDto> {
    const bookingId = createPaymentIntentDto.bookingId;
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      select: ['id', 'totalBookingPrice', 'paymentIntentId']
    });

    if (!booking) {
      throw new BadRequest(RESPONSE_MESSAGES.BOOKING_NOT_FOUND);
    }

    const paymentIntentResult = await this.stripeService.createStripePaymentIntent(
      bookingId,
      accountId,
      booking.totalBookingPrice
    );

    // Save payment intent id
    await this.bookingRepo.update(bookingId, {
      status: BookingStatus.PENDING_PAYMENT,
      paymentIntentId: paymentIntentResult.paymentIntentId
    });

    // Add job to check for payment expiration
    await this.addCancelExpiredPaymentJob(bookingId, paymentIntentResult.paymentIntentId);

    return paymentIntentResult;
  }

  async handleStripeWebhook(signature: string, rawBody: Buffer) {
    await this.stripeService.handleStripeWebhook(
      signature,
      rawBody,
      this.handlePaymentSuccess.bind(this),
      this.handlePaymentFailure.bind(this)
    );
  }

  private async addCancelExpiredPaymentJob(bookingId: string, paymentIntentId: string) {
    await this.cancelExpiredPaymentQueue.add(
      { bookingId, paymentIntentId },
      {
        jobId: JOB_TYPES.cancelPayment(bookingId),
        delay: PAYMENT_EXPIRATION_MILLISECONDS
      }
    );
  }

  private async removeCancelExpiredPaymentJob(bookingId: string) {
    const job = await this.cancelExpiredPaymentQueue.getJob(JOB_TYPES.cancelPayment(bookingId));

    if (job) {
      await job.remove();
      console.log(`Removed cancel job for booking ${bookingId}`);
    }
  }

  private async handlePaymentSuccess(bookingId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      select: ['id', 'status']
    });
    if (!booking) {
      throw new BadRequest(RESPONSE_MESSAGES.BOOKING_NOT_FOUND);
    }

    await this.bookingRepo.update(bookingId, { status: BookingStatus.CONFIRMED });

    // Remove the cancel payment job
    await this.removeCancelExpiredPaymentJob(bookingId);
  }

  private async handlePaymentFailure(bookingId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      select: ['id', 'paymentIntentId']
    });
    if (!booking) {
      throw new BadRequest(RESPONSE_MESSAGES.BOOKING_NOT_FOUND);
    }

    // Remove the cancel payment job
    await this.removeCancelExpiredPaymentJob(bookingId);

    // Delete the booking
    await this.bookingRepo.delete({ id: bookingId });
  }

  async cancelPayment(bookingId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      select: ['id', 'paymentIntentId', 'status']
    });

    if (!booking) {
      throw new BadRequest(RESPONSE_MESSAGES.BOOKING_NOT_FOUND);
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequest(RESPONSE_MESSAGES.BOOKING_CANNOT_CANCEL);
    }

    if (!booking.paymentIntentId) {
      throw new BadRequest(RESPONSE_MESSAGES.INVALID_PAYMENT_DETAILS);
    }

    // Cancel the Stripe payment intent
    await this.stripeService.cancelStripePaymentIntent(booking.paymentIntentId);

    // Remove the cancel payment job
    await this.removeCancelExpiredPaymentJob(bookingId);

    // Delete the booking
    await this.bookingRepo.delete({ id: bookingId });
  }
}
