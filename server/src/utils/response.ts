import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export const success = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
) => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  return res.status(statusCode).json(response);
};

export const error = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown
) => {
  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      ...(code ? { code } : {}),
      ...(details !== undefined ? { details } : {}),
    },
  };
  return res.status(statusCode).json(response);
};

export const paginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  pageSize: number
) => {
  return success(res, {
    items: data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
};
