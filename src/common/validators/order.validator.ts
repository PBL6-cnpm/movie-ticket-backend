import { MESSAGE_KEY, ORDER_PARAM_REGEX } from '@common/constants/base.constant';
import { NotAcceptableException } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'orderValidator', async: false })
export class OrderValidator implements ValidatorConstraintInterface {
  validate(order: string): boolean {
    if (!(order && order.match(ORDER_PARAM_REGEX)))
      throw new NotAcceptableException(MESSAGE_KEY.FORMAT_ORDER_INCORRECT);
    return true;
  }
}
