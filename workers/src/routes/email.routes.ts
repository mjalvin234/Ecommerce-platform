import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';

const emailRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

emailRoutes.use('*', authMiddleware);

// 获取登录历史
emailRoutes.get('/login-history', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    const limit = parseInt(c.req.query('limit') || '10');

    const result = await c.env.DB.prepare(`
      SELECT * FROM login_logs
      WHERE user_id = ?
      ORDER BY login_time DESC
      LIMIT ?
    `).bind(user.id, limit).all();

    return c.json({
      logs: result.results || [],
    });
  } catch (error) {
    console.error('获取登录历史错误:', error);
    // 返回空数据，避免阻塞前端
    return c.json({
      logs: [],
    });
  }
});

// 获取登录统计
emailRoutes.get('/login-stats', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    const totalResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM login_logs WHERE user_id = ?'
    ).bind(user.id).first() as any;

    const successResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM login_logs WHERE user_id = ? AND login_status = ?'
    ).bind(user.id, 'success').first() as any;

    const failedResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM login_logs WHERE user_id = ? AND login_status = ?'
    ).bind(user.id, 'failed').first() as any;

    const lastLogin = await c.env.DB.prepare(
      'SELECT login_time, ip_address FROM login_logs WHERE user_id = ? AND login_status = ? ORDER BY login_time DESC LIMIT 1'
    ).bind(user.id, 'success').first() as any;

    return c.json({
      totalLogins: totalResult?.count || 0,
      successfulLogins: successResult?.count || 0,
      failedLogins: failedResult?.count || 0,
      lastLoginTime: lastLogin?.login_time || null,
      lastLoginIP: lastLogin?.ip_address || null,
    });
  } catch (error) {
    console.error('获取登录统计错误:', error);
    return c.json({
      totalLogins: 0,
      successfulLogins: 0,
      failedLogins: 0,
      lastLoginTime: null,
      lastLoginIP: null,
    });
  }
});

export default emailRoutes;
