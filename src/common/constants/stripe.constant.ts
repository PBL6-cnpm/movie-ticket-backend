export const CURRENCY = {
  USD: 'usd'
};

export const PAYMENT_EXPIRATION_MILLISECONDS = 5 * 60 * 1000; // 5 minutes in milliseconds

export const STRIPE_EVENTS = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',

  PAYMENT_INTENT_CANCELED: 'payment_intent.canceled'
};
