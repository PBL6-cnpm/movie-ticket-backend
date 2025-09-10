export interface ApiMessage {
  message: string;
  code: string;
}

export interface SuccessResponse<T> {
  message: string;
  code: string;
  data: T | null;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  code: string;
  data: T | null;
}
