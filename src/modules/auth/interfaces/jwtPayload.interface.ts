export interface JwtPayload {
  accountId: string;
  email: string;
  code?: string;
  iat: number;
  exp?: number;
}
