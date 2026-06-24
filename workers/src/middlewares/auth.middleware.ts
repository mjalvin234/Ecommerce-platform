import { Context, Next } from 'hono';
import type { Bindings, Variables } from '../types';
import { verify } from 'jsonwebtoken';

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

export const authMiddleware = async (c: AppContext, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        error: { message: '请先登录' },
      }, 401);
    }

    const token = authHeader.substring(7);
    const jwtSecret = c.env.JWT_SECRET;

    if (!jwtSecret) {
      return c.json({
        success: false,
        error: { message: '服务器配置错误' },
      }, 500);
    }

    const decoded = verify(token, jwtSecret) as {
      id: string;
      email: string;
      role: string;
    };

    // 将用户信息存入上下文
    c.set('user', decoded);

    await next();
  } catch (error) {
    return c.json({
      success: false,
      error: { message: '无效的认证令牌' },
    }, 401);
  }
};

export const adminMiddleware = async (c: AppContext, next: Next) => {
  const user = c.get('user');

  if (!user || user.role !== 'admin') {
    return c.json({
      success: false,
      error: { message: '需要管理员权限' },
    }, 403);
  }

  await next();
};

export const optionalAuthMiddleware = async (c: AppContext, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtSecret = c.env.JWT_SECRET;

      if (jwtSecret) {
        const decoded = verify(token, jwtSecret) as {
          id: string;
          email: string;
          role: string;
        };
        c.set('user', decoded);
      }
    }
  } catch (error) {
    // 可选认证，忽略错误
  }

  await next();
};
