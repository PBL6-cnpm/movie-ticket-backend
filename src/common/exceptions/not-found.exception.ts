import { HttpStatus } from '@nestjs/common';
import { ApiMessage } from '../interfaces/api-response.interface';
import CustomHttpException from './custom-http.exception';

export class NotFound extends CustomHttpException {
  constructor(apiMessage: ApiMessage) {
    super(apiMessage, HttpStatus.NOT_FOUND);
  }
}
