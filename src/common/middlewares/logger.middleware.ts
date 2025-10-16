import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger: Logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      const obfuscateRequest: Record<string, unknown> = req.body
        ? JSON.parse(JSON.stringify(req.body))
        : {};

      const sensitiveFields: string[] = [
        'password',
        'newPassword',
        'currentPassword',
        'confirmPassword'
      ];

      sensitiveFields.forEach((field: string) => {
        if (obfuscateRequest[field] && typeof obfuscateRequest[field] === 'string') {
          obfuscateRequest[field] = '*******';
        }
      });

      if (obfuscateRequest && Object.keys(obfuscateRequest).length > 0) {
        this.logger.log(
          `${new Date().toISOString()} - [Request] ${req.method} ${req.originalUrl || req.baseUrl} - ${JSON.stringify(obfuscateRequest)}`
        );
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `${new Date().toISOString()} - [Request Error] ${req.method} ${req.originalUrl || req.baseUrl} - ${errorMessage}`
      );
    }

    next();
  }
}
