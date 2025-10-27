import { ContextUser } from './user.type';

declare module 'express' {
  export interface Request {
    user?: ContextUser;
    cookies?: Record<string, string>;
    refreshToken?: string;
  }
}

export {};
