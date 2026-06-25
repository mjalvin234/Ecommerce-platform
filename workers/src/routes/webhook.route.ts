import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';

const webhookRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

webhookRoutes.use('*', authMiddleware);

// 获取用户的 Webhook 列表
webhookRoutes.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ items: [], total: 0 });

  try {
    const result = await c.env.DB.prepare(`
      SELECT id, name, url, events, status, created_at
      FROM webhooks
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(user.id).all();

    return c.json({
      items: result.results?.map((w: any) => ({
        id: w.id,
        name: w.name,
        url: w.url,
        events: w.events ? JSON.parse(w.events as string) : [],
        status: w.status,
        createdAt: w.created_at,
      })) || [],
      total: result.results?.length || 0,
    });
  } catch (error) {
    return c.json({ items: [], total: 0 });
  }
});

// 创建 Webhook
webhookRoutes.post('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { name, url, events } = await c.req.json();

  try {
    const id = uuidv4();
    const secret = `whsec_${randomBytes(24).toString('hex')}`;

    await c.env.DB.prepare(`
      INSERT INTO webhooks (id, user_id, name, url, events, secret, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
    `).bind(id, user.id, name, url, JSON.stringify(events || []), secret, new Date().toISOString()).run();

    return c.json({ id, name, url, secret });
  } catch (error) {
    return c.json({ success: false, error: { message: '创建失败' } }, 500);
  }
});

// 更新 Webhook
webhookRoutes.put('/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { id } = c.req.param();
  const { name, url, events } = await c.req.json();

  try {
    await c.env.DB.prepare(`
      UPDATE webhooks
      SET name = COALESCE(?, name),
          url = COALESCE(?, url),
          events = COALESCE(?, events)
      WHERE id = ? AND user_id = ?
    `).bind(name, url, events ? JSON.stringify(events) : null, id, user.id).run();

    return c.json({ id, url });
  } catch (error) {
    return c.json({ success: false, error: { message: '更新失败' } }, 500);
  }
});

// 删除 Webhook
webhookRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { id } = c.req.param();

  try {
    await c.env.DB.prepare(`
      DELETE FROM webhooks WHERE id = ? AND user_id = ?
    `).bind(id, user.id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: { message: '删除失败' } }, 500);
  }
});

// 重新生成密钥
webhookRoutes.post('/:id/regenerate', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { id } = c.req.param();
  const secret = `whsec_${randomBytes(24).toString('hex')}`;

  try {
    await c.env.DB.prepare(`
      UPDATE webhooks SET secret = ? WHERE id = ? AND user_id = ?
    `).bind(secret, id, user.id).run();

    return c.json({ id, secret });
  } catch (error) {
    return c.json({ success: false, error: { message: '重新生成失败' } }, 500);
  }
});

export default webhookRoutes;
