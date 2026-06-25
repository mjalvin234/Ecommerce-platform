import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const newsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 获取公告列表（公开）
newsRoutes.get('/', async (c) => {
  try {
    const { page = '1', pageSize = '10' } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const result = await c.env.DB.prepare(`
      SELECT id, title, content, type, created_at
      FROM news
      WHERE status = 'published'
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(parseInt(pageSize), offset).all();

    return c.json({
      items: result.results || [],
      total: result.results?.length || 0,
    });
  } catch (error) {
    return c.json({ items: [], total: 0 });
  }
});

// 获取单个公告
newsRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await c.env.DB.prepare(`
      SELECT id, title, content, type, created_at
      FROM news
      WHERE id = ? AND status = 'published'
    `).bind(id).first();

    if (!result) {
      return c.json({ success: false, error: { message: '公告不存在' } }, 404);
    }

    return c.json(result);
  } catch (error) {
    return c.json({ success: false, error: { message: '获取失败' } }, 500);
  }
});

// 管理接口
newsRoutes.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ success: false, error: { message: '需要管理员权限' } }, 403);
  }

  const { title, content, type = 'notice' } = await c.req.json();

  try {
    const id = uuidv4();
    await c.env.DB.prepare(`
      INSERT INTO news (id, title, content, type, status, created_at)
      VALUES (?, ?, ?, ?, 'published', ?)
    `).bind(id, title, content, type, new Date().toISOString()).run();

    return c.json({ id });
  } catch (error) {
    return c.json({ success: false, error: { message: '创建失败' } }, 500);
  }
});

export default newsRoutes;
