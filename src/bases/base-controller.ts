import { RESPONSE_MESSAGES } from '@common/constants';
import { ApiMessage, SuccessResponse } from '@common/interfaces/api-response.interface';

export class BaseController {
  success<T>(data: T, apiMessage: ApiMessage = RESPONSE_MESSAGES.SUCCESSFUL): SuccessResponse<T> {
    return {
      message: apiMessage.message,
      code: apiMessage.code,
      data
    };
  }

  created<T>(
    data: T,
    apiMessage: ApiMessage = RESPONSE_MESSAGES.CREATED_SUCCESS
  ): SuccessResponse<T> {
    return this.success(data, apiMessage);
  }

  updated<T>(
    data: T,
    apiMessage: ApiMessage = RESPONSE_MESSAGES.UPDATED_SUCCESS
  ): SuccessResponse<T> {
    return this.success(data, apiMessage);
  }

  deleted(apiMessage: ApiMessage = RESPONSE_MESSAGES.DELETED_SUCCESS): SuccessResponse<null> {
    return {
      message: apiMessage.message,
      code: apiMessage.code,
      data: null
    };
  }
}
