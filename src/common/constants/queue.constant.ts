export const QUEUE_KEY = {
  sendEmail: 'sendEmail',
  cancelExpiredPayment: 'cancelExpiredPayment'
};

export const BULL_OPTS = {
  removeOnComplete: true,
  removeOnFail: true,
  timeout: 5 * 60 * 1000 //5m
};

export const JOB_TYPES = {
  cancelPayment: (bookingId: string) => `cancel-payment-${bookingId}`
};
