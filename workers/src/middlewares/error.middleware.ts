import { Context } from 'hono';
import type { Bindings, Variables } from '../types';

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

export const errorHandler = (err: Error, c: AppContext) => {
  console.error('Error:', err);

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return c.json({
      success: false,
      error: { message: '无效的认证令牌' },
    }, 401);
  }

  if (err.name === 'TokenExpiredError') {
    return c.json({
      success: false,
      error: { message: '认证令牌已过期' },
    }, 401);
  }

  // 验证错误
  if (err.name === 'ZodError') {
    return c.json({
      success: false,
      error: { message: '数据验证失败', details: err.message },
    }, 400);
  }

  // 默认错误
  return c.json({
    success: false,
    error: { message: err.message || '服务器内部错误' },
  }, 500);
};
