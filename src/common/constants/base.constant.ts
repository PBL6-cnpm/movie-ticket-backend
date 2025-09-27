export enum SortType {
  asc = 'asc',
  desc = 'desc'
}

export const ORDER_PARAM_REGEX = /^[a-zA-Z0-9.]+:(asc|desc)$/;

export const MESSAGE_KEY = {
  FORMAT_ORDER_INCORRECT: 'Format of order is incorrect'
};
