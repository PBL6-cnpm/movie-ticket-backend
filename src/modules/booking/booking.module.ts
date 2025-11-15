import { Module } from '@nestjs/common';
import { CloudinaryService } from '@shared/modules/cloudinary/cloudinary.service';
import { StripeModule } from '@shared/modules/stripe/stripe.module';
import { BookingPaymentService } from './booking-payment.service';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingStatisticController } from './booking-statistic.controller';
import { BookingStatisticService } from './booking-statistic.service';

@Module({
  imports: [StripeModule],
  controllers: [BookingController, BookingStatisticController],
  providers: [BookingService, BookingPaymentService, BookingStatisticService, CloudinaryService]
})
export class BookingModule {}
