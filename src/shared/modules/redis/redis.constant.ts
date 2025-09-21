export const REDIS_KEYS = {
  // Blacklist
  BLACKLIST: (token: string) => `blacklist:${token}`,

  // Auth
  REFRESH_TOKEN: (accountId: string) => `account:${accountId}:refresh_token`
};
