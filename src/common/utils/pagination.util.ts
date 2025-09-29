import { IPaginatedResponse } from '@common/types/pagination-base.type';

export default class PaginationHelper {
  static pagination<T>({
    limit,
    offset,
    totalItems,
    items
  }: {
    limit: number;
    offset: number;
    totalItems: number;
    items: T[];
  }): IPaginatedResponse<T> {
    return {
      items,
      meta: {
        limit,
        offset,
        total: totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }
}
