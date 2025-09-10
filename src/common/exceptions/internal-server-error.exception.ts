import { HttpStatus } from '@nestjs/common';
import { ApiMessage } from '../interfaces/api-response.interface';
import CustomHttpException from './custom-http.exception';

export class InternalServerError extends CustomHttpException {
  constructor(apiMessage: ApiMessage) {
    super(apiMessage, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
