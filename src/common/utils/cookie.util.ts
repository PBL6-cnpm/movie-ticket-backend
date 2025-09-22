export const getCookieOptions = (nodeEnv: string) => {
  return {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'lax' as const,
    path: '/'
  };
};
