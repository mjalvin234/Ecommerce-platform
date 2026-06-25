import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';

const followRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

followRoutes.use('*', authMiddleware);

// 获取关注列表
followRoutes.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ items: [], total: 0 });

  try {
    const result = await c.env.DB.prepare(`
      SELECT f.following_id, u.company_name, u.email
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ? AND u.deleted_at IS NULL
      ORDER BY f.created_at DESC
    `).bind(user.id).all();

    return c.json({
      items: result.results?.map((r: any) => ({
        id: r.following_id,
        companyName: r.company_name,
        email: r.email,
      })) || [],
      total: result.results?.length || 0,
    });
  } catch (error) {
    return c.json({ items: [], total: 0 });
  }
});

// 关注/取消关注
followRoutes.post('/:userId', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const targetUserId = c.req.param('userId');
  const { action } = await c.req.json();

  try {
    if (action === 'follow') {
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO follows (follower_id, following_id, created_at)
        VALUES (?, ?, ?)
      `).bind(user.id, targetUserId, new Date().toISOString()).run();
    } else {
      await c.env.DB.prepare(`
        DELETE FROM follows WHERE follower_id = ? AND following_id = ?
      `).bind(user.id, targetUserId).run();
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: { message: '操作失败' } }, 500);
  }
});

// 获取关注统计
followRoutes.get('/stats', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ followers: 0, following: 0 });

  try {
    const followers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM follows WHERE following_id = ?
    `).bind(user.id).first();

    const following = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM follows WHERE follower_id = ?
    `).bind(user.id).first();

    return c.json({
      followers: followers?.count || 0,
      following: following?.count || 0,
    });
  } catch (error) {
    return c.json({ followers: 0, following: 0 });
  }
});

export default followRoutes;
