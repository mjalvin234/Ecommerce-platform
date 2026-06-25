import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';

const creditRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

creditRoutes.use('*', authMiddleware);

// 获取我的信用信息
creditRoutes.get('/info', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  return c.json({
    score: 60,
    level: 'normal',
    levelLabel: '普通',
    recentChange: 0,
    positiveCount: 0,
    negativeCount: 0,
  });
});

// 获取信用历史
creditRoutes.get('/history', async (c) => {
  return c.json({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
});

// 获取用户信用
creditRoutes.get('/user/:userId', async (c) => {
  return c.json({
    score: 60,
    level: 'normal',
    levelLabel: '普通',
  });
});

export default creditRoutes;
