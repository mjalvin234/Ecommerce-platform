import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';

const alertRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

alertRoutes.use('*', authMiddleware);

// 获取未读消息数量
alertRoutes.get('/unread-count', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ count: 0 });

  try {
    const result = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM alerts
      WHERE user_id = ? AND read = 0
    `).bind(user.id).first();

    return c.json({ count: result?.count || 0 });
  } catch (error) {
    return c.json({ count: 0 });
  }
});

// 标记所有消息已读
alertRoutes.post('/read-all', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: true });

  try {
    await c.env.DB.prepare(`
      UPDATE alerts SET read = 1 WHERE user_id = ? AND read = 0
    `).bind(user.id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: true });
  }
});

// 获取消息列表
alertRoutes.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ items: [], total: 0 });

  try {
    const result = await c.env.DB.prepare(`
      SELECT id, type, title, content, read, created_at
      FROM alerts
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(user.id).all();

    return c.json({
      items: result.results || [],
      total: result.results?.length || 0,
    });
  } catch (error) {
    return c.json({ items: [], total: 0 });
  }
});

export default alertRoutes;
