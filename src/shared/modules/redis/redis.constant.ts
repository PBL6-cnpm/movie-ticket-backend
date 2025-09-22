export const REDIS_KEYS = {
  // Auth
  BLACKLIST: (token: string) => `blacklist:${token}`, // Access token blacklist
  ACTIVE_REFRESH_TOKEN: (token: string) => `active_refresh_token:${token}`,
  USER_SESSIONS: (accountId: string) => `user_sessions:${accountId}`
};
