export const REDIS_KEYS = {
  // Auth
  BLACKLIST: (token: string) => `blacklist:${token}`, // Access token blacklist
  EMAIL_VERIFICATION: (accountId: string) => `account:${accountId}:email_verification`,
  ACTIVE_REFRESH_TOKEN: (token: string) => `active_refresh_token:${token}`,
  USER_SESSIONS: (accountId: string) => `user_sessions:${accountId}`
};
