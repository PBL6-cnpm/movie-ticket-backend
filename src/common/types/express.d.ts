import { UserPayload } from './user-payload.type';

declare module 'express' {
  export interface Request {
    user?: UserPayload;
    cookies?: Record<string, string>;
  }
}

export {};
