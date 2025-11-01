import { Module } from '@nestjs/common';
import { BookingPaymentService } from './booking-payment.service';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { StripeModule } from '@shared/modules/stripe/stripe.module';

@Module({
  imports: [StripeModule],
  controllers: [BookingController],
  providers: [BookingService, BookingPaymentService]
})
export class BookingModule {}
