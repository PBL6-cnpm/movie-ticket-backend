import { QUEUE_KEY } from '@common/constants';
import { BookingStatus } from '@common/enums/booking.enum';
import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking } from '@shared/db/entities/booking.entity';
import { StripeService } from '@shared/modules/stripe/stripe.service';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import { CancelExpiredPaymentJobData } from './payment-job.interface';

@Injectable()
@Processor(QUEUE_KEY.cancelExpiredPayment)
export class PaymentProcessor {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    private readonly stripeService: StripeService
  ) {}

  @Process()
  async handleCancelExpiredPayment(job: Job<unknown>) {
    const { bookingId, paymentIntentId } = job.data as CancelExpiredPaymentJobData;
    try {
      const booking = await this.bookingRepo.findOne({
        where: { id: bookingId },
        select: ['id', 'paymentIntentId', 'status']
      });

      if (!booking || booking.status !== BookingStatus.PENDING_PAYMENT) {
        return;
      }

      // Cancel the Stripe payment intent
      await this.stripeService.cancelStripePaymentIntent(booking.paymentIntentId);

      // Delete the booking
      await this.bookingRepo.delete({
        id: bookingId,
        paymentIntentId
      });
    } catch (error) {
      console.log(error);
    }
  }
}
