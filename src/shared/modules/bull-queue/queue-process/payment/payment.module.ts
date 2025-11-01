import { Global, Module } from '@nestjs/common';
import { PaymentProcessor } from './payment.processor';
import { StripeModule } from '@shared/modules/stripe/stripe.module';

@Global()
@Module({
  imports: [StripeModule],
  providers: [PaymentProcessor]
})
export class PaymentModule {}
