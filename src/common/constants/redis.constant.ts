export const REDIS_KEYS = {
  // Auth
  BLACKLIST: (token: string) => `blacklist:${token}`, // Access token blacklist

  USER_SESSIONS: (accountId: string) => `user_sessions:${accountId}`,

  EMAIL_VERIFICATION: (accountId: string) => `account:${accountId}:email_verification`,
  RESET_PASSWORD: (accountId: string) => `account:${accountId}:reset_password`,

  ACCOUNT_CONTEXT: (accountId: string) => `account:${accountId}:context`
};
