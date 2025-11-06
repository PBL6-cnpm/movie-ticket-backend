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
import { Voucher } from '@shared/db/entities/voucher.entity';

@Injectable()
@Processor(QUEUE_KEY.cancelExpiredPayment)
export class PaymentProcessor {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Voucher) private readonly voucherRepo: Repository<Voucher>,
    private readonly stripeService: StripeService
  ) {}

  @Process('cancel-payment')
  async handleCancelExpiredPayment(job: Job<unknown>) {
    const { bookingId, paymentIntentId } = job.data as CancelExpiredPaymentJobData;
    console.log(`Processing cancel expired payment for bookingId: ${bookingId}`);
    try {
      const booking = await this.bookingRepo.findOne({
        where: { id: bookingId },
        select: ['id', 'paymentIntentId', 'status', 'voucherId']
      });

      if (!booking || booking.status !== BookingStatus.PENDING_PAYMENT) {
        return;
      }

      // Cancel the Stripe payment intent
      await this.stripeService.cancelStripePaymentIntent(booking.paymentIntentId);

      // Refresh voucher if used
      if (booking.voucherId) {
        await this.voucherRepo.increment({ id: booking.voucherId }, 'number', 1);
      }

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
