import { ContextUser } from '@common/types/user.type';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentAccount = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ContextUser => {
    const request: Request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
