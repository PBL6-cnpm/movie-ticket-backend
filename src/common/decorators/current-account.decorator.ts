import { AccountPayload } from '@common/types/account-payload.type';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentAccount = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AccountPayload => {
    const request: Request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
