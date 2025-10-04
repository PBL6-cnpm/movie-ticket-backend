import { ORDER_PARAM_REGEX, RESPONSE_MESSAGES } from '@common/constants';
import { NotAcceptable } from '@common/exceptions';
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'orderValidator', async: false })
export class OrderValidator implements ValidatorConstraintInterface {
  validate(order: string): boolean {
    if (!(order && order.match(ORDER_PARAM_REGEX)))
      throw new NotAcceptable(RESPONSE_MESSAGES.FORMAT_ORDER_INCORRECT);
    return true;
  }
}
