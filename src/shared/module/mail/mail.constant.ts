export const TEMPLATE_MAIL = {
  VERIFY_EMAIL: {
    name: 'verify-email',
    subject: 'Confirm your email address'
  },
  RESEND_VERIFICATION_CODE: {
    name: 'resend-verification-code',
    subject: 'Resend verification code'
  },
  SEND_RESET_PASSWORD: {
    name: 'send-reset-password',
    subject: 'Reset your password'
  }
} as const;

export const MAIL_FROM = 'no-reply@pbl6.com';
