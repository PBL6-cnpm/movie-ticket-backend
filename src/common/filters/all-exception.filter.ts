import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
  HttpException
} from '@nestjs/common';
import { Response, Request } from 'express';
import CustomHttpException from '../exceptions/custom-http.exception';
import { RESPONSE_MESSAGES } from '@common/constants/response-message.constant';
import { RESPONSE_MESSAGES_MAP } from '@common/constants/response-map.constant';
import { ApiResponse } from '@common/interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger: Logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const apiResponse: ApiResponse<null> = {
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR.message,
      code: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR.code,
      data: null
    };

    // CustomHttpException
    if (exception instanceof CustomHttpException) {
      apiResponse.statusCode = exception.getStatus();
      apiResponse.message = exception.getResponseMessage();
      apiResponse.code = exception.getResponseCode();
    }
    // HttpException
    else if (exception instanceof HttpException) {
      apiResponse.statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        apiResponse.message = exceptionResponse;
        apiResponse.code = exceptionResponse.toUpperCase().replace(/ /g, '_');
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const { message, error } = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };

        // Class-validator error
        if (Array.isArray(message) && message.length) {
          const firstMessage = message[0];

          const validationErrorCode = this.getValidationErrorCode(firstMessage);
          if (validationErrorCode) {
            apiResponse.message = firstMessage;
            apiResponse.code = validationErrorCode;
          } else {
            apiResponse.message = firstMessage;
            apiResponse.code = firstMessage.toUpperCase().replace(/ /g, '_');
          }
        } else if (typeof message === 'string') {
          const validationErrorCode = this.getValidationErrorCode(message);
          if (validationErrorCode) {
            apiResponse.message = message;
            apiResponse.code = validationErrorCode;
          } else {
            apiResponse.message = message;
            apiResponse.code = message.toUpperCase().replace(/ /g, '_');
          }
        } else if (error) {
          apiResponse.message = error;
          apiResponse.code = error.toUpperCase().replace(/ /g, '_');
        }
      }
    } else {
      this.logger.error(
        `Unhandled Exception Stack: ${
          exception instanceof Error ? exception.stack : 'No stack available'
        }`
      );

      if (exception instanceof Error && exception.message) {
        apiResponse.message = exception.message;
        apiResponse.code = exception.message.toUpperCase().replace(/ /g, '_');
      }
    }

    if (
      apiResponse.code === RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR.code &&
      apiResponse.message !== RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR.message
    ) {
      apiResponse.code = apiResponse.message.toUpperCase().replace(/ /g, '_');
    }

    if (
      apiResponse.message &&
      apiResponse.code === RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR.code
    ) {
      apiResponse.code = apiResponse.message.toUpperCase().replace(/ /g, '_');
    }

    this.logger.error(
      `[${apiResponse.statusCode}] ${request.method} ${
        request.url
      } - Response: ${JSON.stringify(apiResponse)}`
    );

    response.status(apiResponse.statusCode).json(apiResponse);
  }

  private getValidationErrorCode(message: string): string | null {
    return RESPONSE_MESSAGES_MAP.get(message) || null;
  }
}
