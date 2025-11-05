import { Module } from '@nestjs/common';
import { CloudinaryService } from '@shared/modules/cloudinary/cloudinary.service';
import { StripeModule } from '@shared/modules/stripe/stripe.module';
import { BookingPaymentService } from './booking-payment.service';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [StripeModule],
  controllers: [BookingController],
  providers: [BookingService, BookingPaymentService, CloudinaryService]
})
export class BookingModule {}
