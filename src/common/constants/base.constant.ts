export enum SortType {
  asc = 'asc',
  desc = 'desc'
}

export const ORDER_PARAM_REGEX = /^[a-zA-Z0-9.]+:(asc|desc)$/;

export const MESSAGE_KEY = {
  FORMAT_ORDER_INCORRECT: 'Format of order is incorrect',
  TOKEN_IS_EMPTY: 'Token is empty',
  INVALID_TOKEN: 'Token is invalid',
  USER_IS_DISABLED: 'User is disabled',
  USER_IS_BLOCKED: 'User is blocked'
};

export const defaultTimezone = 'Asia/Ho_Chi_Minh';
