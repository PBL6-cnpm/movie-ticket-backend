// src/common/interceptors/response.interceptor.ts
import { RESPONSE_MESSAGES } from '@common/constants';
import { ApiResponse, SuccessResponse } from '@common/interfaces/api-response.interface';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<SuccessResponse<T>, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();

    const response: Response = ctx.getResponse();

    return next.handle().pipe(
      map((data: SuccessResponse<T>) => ({
        success: true,
        statusCode: response.statusCode,
        message: data.message || RESPONSE_MESSAGES.SUCCESSFUL.message,
        code: data.code || RESPONSE_MESSAGES.SUCCESSFUL.code,
        data: data.data || null
      }))
    );
  }
}
