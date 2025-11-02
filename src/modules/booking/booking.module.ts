import { Module } from '@nestjs/common';
import { StripeModule } from '@shared/modules/stripe/stripe.module';
import { BookingPaymentService } from './booking-payment.service';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [StripeModule],
  controllers: [BookingController],
  providers: [BookingService, BookingPaymentService]
})
export class BookingModule {}
