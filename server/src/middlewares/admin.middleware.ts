import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from './error.middleware.js';

/**
 * 管理员权限中间件
 */
export const adminMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new UnauthorizedError('未登录');
  }

  if (req.user.role !== 'admin') {
    throw new ForbiddenError('需要管理员权限');
  }

  next();
};

/**
 * 角色检查中间件工厂
 */
export const requireRoles = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('未登录');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('权限不足');
    }

    next();
  };
};
