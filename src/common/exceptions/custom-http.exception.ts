import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiMessage } from '../interfaces/api-response.interface';

export default class CustomHttpException extends HttpException {
  constructor(
    private readonly apiMessage: ApiMessage,
    statusCode: number = HttpStatus.BAD_REQUEST
  ) {
    super(apiMessage, statusCode);
  }

  getResponseMessage(): string {
    return this.apiMessage.message;
  }

  getResponseCode(): string {
    return this.apiMessage.code;
  }
}
