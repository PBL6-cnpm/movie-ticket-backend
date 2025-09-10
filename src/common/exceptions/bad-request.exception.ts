import { HttpStatus } from '@nestjs/common';
import CustomHttpException from './custom-http.exception';

export class BadRequest extends CustomHttpException {
  constructor({ message, code }: { message: string; code: string }) {
    super({ message, code }, HttpStatus.BAD_REQUEST);
  }
}
