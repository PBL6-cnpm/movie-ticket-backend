// decorators/client-ip.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const ClientIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();

    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIp = request.headers['x-real-ip'] as string;
    const cfConnectingIp = request.headers['cf-connecting-ip'] as string; // Cloudflare

    if (cfConnectingIp) return cfConnectingIp;
    if (realIp) return realIp;
    if (forwarded) return forwarded.split(',')[0].trim();
    if (request.socket?.remoteAddress) {
      return request.socket.remoteAddress.replace(/^::ffff:/, '');
    }
    if (request.ip) return request.ip;

    return 'unknown';
  }
);
