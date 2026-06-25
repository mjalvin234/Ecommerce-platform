import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';

const apikeyRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

apikeyRoutes.use('*', authMiddleware);

// 获取用户的 API Key 列表
apikeyRoutes.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ items: [], total: 0 });

  try {
    const result = await c.env.DB.prepare(`
      SELECT id, name, plan, status, created_at, last_used_at
      FROM api_keys
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(user.id).all();

    return c.json({
      items: result.results?.map((k: any) => ({
        id: k.id,
        name: k.name,
        plan: k.plan,
        status: k.status,
        createdAt: k.created_at,
        lastUsedAt: k.last_used_at,
      })) || [],
      total: result.results?.length || 0,
    });
  } catch (error) {
    return c.json({ items: [], total: 0 });
  }
});

// 创建 API Key
apikeyRoutes.post('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { name } = await c.req.json();

  try {
    const id = uuidv4();
    const key = `sk_${randomBytes(32).toString('hex')}`;
    const secret = randomBytes(16).toString('hex');

    await c.env.DB.prepare(`
      INSERT INTO api_keys (id, user_id, name, api_key, secret_key, plan, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'free', 'active', ?)
    `).bind(id, user.id, name || 'API Key', key, secret, new Date().toISOString()).run();

    return c.json({ id, name: name || 'API Key', key, secret });
  } catch (error) {
    return c.json({ success: false, error: { message: '创建失败' } }, 500);
  }
});

// 重新生成密钥
apikeyRoutes.post('/:id/regenerate', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { id } = c.req.param();
  const secret = randomBytes(16).toString('hex');

  try {
    await c.env.DB.prepare(`
      UPDATE api_keys SET secret_key = ? WHERE id = ? AND user_id = ?
    `).bind(secret, id, user.id).run();

    return c.json({ id, secret });
  } catch (error) {
    return c.json({ success: false, error: { message: '重新生成失败' } }, 500);
  }
});

// 切换状态
apikeyRoutes.post('/:id/toggle', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { id } = c.req.param();

  try {
    await c.env.DB.prepare(`
      UPDATE api_keys SET status = CASE WHEN status = 'active' THEN 'disabled' ELSE 'active' END
      WHERE id = ? AND user_id = ?
    `).bind(id, user.id).run();

    const result = await c.env.DB.prepare(`
      SELECT status FROM api_keys WHERE id = ?
    `).bind(id).first();

    return c.json({ id, status: result?.status || 'active' });
  } catch (error) {
    return c.json({ success: false, error: { message: '操作失败' } }, 500);
  }
});

// 删除 API Key
apikeyRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { id } = c.req.param();

  try {
    await c.env.DB.prepare(`
      DELETE FROM api_keys WHERE id = ? AND user_id = ?
    `).bind(id, user.id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: { message: '删除失败' } }, 500);
  }
});

// 升级套餐
apikeyRoutes.post('/:id/upgrade', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { id } = c.req.param();
  const { plan } = await c.req.json();

  try {
    await c.env.DB.prepare(`
      UPDATE api_keys SET plan = ? WHERE id = ? AND user_id = ?
    `).bind(plan, id, user.id).run();

    return c.json({ id, plan });
  } catch (error) {
    return c.json({ success: false, error: { message: '升级失败' } }, 500);
  }
});

export default apikeyRoutes;
