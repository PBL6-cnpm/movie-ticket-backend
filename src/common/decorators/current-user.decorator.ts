import { UserPayload } from '@common/types/user-payload.type';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request: Request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
