import Stripe from 'stripe';

export class PaymentIntentDto {
  paymentIntentId: string;
  clientSecret: string;

  constructor(paymentIntent: Stripe.PaymentIntent) {
    this.paymentIntentId = paymentIntent.id;
    this.clientSecret = paymentIntent.client_secret;
  }
}
