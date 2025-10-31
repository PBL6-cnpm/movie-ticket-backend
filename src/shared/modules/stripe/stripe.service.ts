import { RESPONSE_MESSAGES } from '@common/constants';
import { CURRENCY, STRIPE_EVENTS } from '@common/constants/stripe.constant';
import { BadRequest } from '@common/exceptions';
import { convertVNDToUSD } from '@common/utils/convert.util';
import { STRIPE } from '@configs/env.config';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from '@shared/db/entities/account.entity';
import Stripe from 'stripe';
import { Repository } from 'typeorm';
import { PaymentIntentDto } from './dto/payment-intent.dto';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(@InjectRepository(Account) private readonly accountRepo: Repository<Account>) {
    this.stripe = new Stripe(STRIPE.secretKey);
  }

  async createStripePaymentIntent(
    bookingId: string,
    accountId: string,
    totalPrice: number
  ): Promise<PaymentIntentDto> {
    const stripeCustomerId = await this.getStripeCustomer(accountId);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: convertVNDToUSD(totalPrice),
      currency: CURRENCY.USD,
      customer: stripeCustomerId,
      setup_future_usage: 'on_session', // Save the payment method for future use
      automatic_payment_methods: { enabled: true },
      metadata: { bookingId }
    });

    return new PaymentIntentDto(paymentIntent);
  }

  async handleStripeWebhook(
    signature: string,
    rawBody: Buffer,
    handlePaymentSuccess: (bookingId: string) => Promise<void>,
    handlePaymentFailure: (bookingId: string) => Promise<void>
  ) {
    const webhookSecret = STRIPE.webhookSecret;

    if (!signature || !webhookSecret) {
      throw new BadRequest(RESPONSE_MESSAGES.STRIPE_WEBHOOK_INVALID);
    }

    try {
      const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      switch (event.type) {
        case STRIPE_EVENTS.PAYMENT_INTENT_SUCCEEDED: {
          await handlePaymentSuccess(paymentIntent.metadata?.bookingId);
          console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
          break;
        }
        case STRIPE_EVENTS.PAYMENT_INTENT_FAILED: {
          await handlePaymentFailure(paymentIntent.metadata?.bookingId);

          const failureMessage =
            paymentIntent.last_payment_error && paymentIntent.last_payment_error.message;
          console.log(`PaymentIntent failed: ${failureMessage}`);

          break;
        }
        default: {
          console.log(`Unhandled event type ${event.type}`);
        }
      }
      return { received: true };
    } catch (err: unknown) {
      console.error('Error handling Stripe webhook:', err);
      throw new BadRequest(RESPONSE_MESSAGES.STRIPE_WEBHOOK_INVALID);
    }
  }

  private async getStripeCustomer(accountId: string): Promise<string> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId },
      select: ['email', 'fullName', 'stripeCustomerId']
    });

    if (!account) {
      throw new BadRequest(RESPONSE_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    // If we already have a Stripe customer ID saved, return it
    if (account.stripeCustomerId) {
      return account.stripeCustomerId;
    }

    // Check if a Stripe customer already exists with this email
    const existingCustomers = await this.stripe.customers.list({
      email: account.email,
      limit: 1
    });

    let stripeCustomer: Stripe.Customer;

    if (existingCustomers.data.length > 0) {
      // Use existing customer
      stripeCustomer = existingCustomers.data[0];
      console.log(`Existing Stripe customer found: ${stripeCustomer.id}`);
    } else {
      // Create new customer
      stripeCustomer = await this.stripe.customers.create({
        email: account.email,
        name: account.fullName
      });
      console.log(`Created new Stripe customer: ${stripeCustomer.id}`);
    }

    // Save the Stripe customer ID to our database
    await this.accountRepo.update(accountId, {
      stripeCustomerId: stripeCustomer.id
    });

    return stripeCustomer.id;
  }

  async cancelStripePaymentIntent(paymentIntentId: string) {
    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status === 'requires_payment_method' || intent.status === 'requires_confirmation') {
      await this.stripe.paymentIntents.cancel(paymentIntentId);
      console.log(`Cancelled PaymentIntent ${paymentIntentId}`);
    }
  }
}
