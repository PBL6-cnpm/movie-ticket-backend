import { AccountPayload } from './account-payload.type';

declare module 'express' {
  export interface Request {
    user?: AccountPayload;
    cookies?: Record<string, string>;
  }
}

export {};
