import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';

const favoritesRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

favoritesRoutes.use('*', authMiddleware);

// 获取收藏列表
favoritesRoutes.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  return c.json({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
});

// 添加收藏
favoritesRoutes.post('/', async (c) => {
  return c.json({ id: 'mock-id' });
});

// 移除收藏
favoritesRoutes.delete('/:inventoryId', async (c) => {
  return c.json({ success: true });
});

// 检查收藏状态
favoritesRoutes.post('/check', async (c) => {
  return c.json({});
});

// 获取收藏数量
favoritesRoutes.get('/count', async (c) => {
  return c.json({ count: 0 });
});

export default favoritesRoutes;
