export const QUEUE_KEY = {
  sendEmail: 'sendEmail'
};

export const BULL_OPTS = {
  removeOnComplete: true,
  removeOnFail: true,
  timeout: 5 * 60 * 1000 //5m
};
