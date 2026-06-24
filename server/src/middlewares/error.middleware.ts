import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response.js';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '权限不足') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  console.error('Stack:', err.stack);

  if (err instanceof AppError) {
    return error(res, err.message, err.statusCode, err.code);
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    return error(res, '数据验证失败', 400, 'VALIDATION_ERROR', err);
  }

  // TypeORM error
  if (err.name === 'QueryFailedError') {
    return error(res, '数据库操作失败', 500, 'DATABASE_ERROR');
  }

  // Unknown error
  return error(res, '服务器内部错误', 500);
};
