import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const packageRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

packageRoutes.use('*', authMiddleware);

// 获取套餐列表
packageRoutes.get('/', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT id, name, description, price, items, status, created_at
      FROM packages
      WHERE status = 'active'
      ORDER BY price ASC
    `).all();

    return c.json({
      items: result.results?.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        items: p.items ? JSON.parse(p.items as string) : [],
        status: p.status,
        createdAt: p.created_at,
      })) || [],
      total: result.results?.length || 0,
    });
  } catch (error) {
    return c.json({ items: [], total: 0 });
  }
});

// 创建套餐（卖家）
packageRoutes.post('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { name, description, price, items } = await c.req.json();

  try {
    const id = uuidv4();
    await c.env.DB.prepare(`
      INSERT INTO packages (id, seller_id, name, description, price, items, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)
    `).bind(id, user.id, name, description, price, JSON.stringify(items || []), new Date().toISOString()).run();

    return c.json({ id });
  } catch (error) {
    return c.json({ success: false, error: { message: '创建失败' } }, 500);
  }
});

// 更新套餐
packageRoutes.put('/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { id } = c.req.param();
  const { name, description, price, items } = await c.req.json();

  try {
    await c.env.DB.prepare(`
      UPDATE packages
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          items = COALESCE(?, items)
      WHERE id = ? AND seller_id = ?
    `).bind(name, description, price, items ? JSON.stringify(items) : null, id, user.id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: { message: '更新失败' } }, 500);
  }
});

// 删除套餐
packageRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { id } = c.req.param();

  try {
    await c.env.DB.prepare(`
      DELETE FROM packages WHERE id = ? AND seller_id = ?
    `).bind(id, user.id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: { message: '删除失败' } }, 500);
  }
});

// 发布套餐
packageRoutes.post('/:id/publish', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { id } = c.req.param();

  try {
    await c.env.DB.prepare(`
      UPDATE packages SET status = 'active' WHERE id = ? AND seller_id = ?
    `).bind(id, user.id).run();

    return c.json({ success: true, status: 'active' });
  } catch (error) {
    return c.json({ success: false, error: { message: '发布失败' } }, 500);
  }
});

// 购买套餐
packageRoutes.post('/:id/buy', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { id } = c.req.param();

  try {
    const pkg = await c.env.DB.prepare(`
      SELECT * FROM packages WHERE id = ? AND status = 'active'
    `).bind(id).first();

    if (!pkg) {
      return c.json({ success: false, error: { message: '套餐不存在' } }, 404);
    }

    // 创建订单
    const orderId = uuidv4();
    const orderNumber = `PKG-${Date.now()}`;

    await c.env.DB.prepare(`
      INSERT INTO orders (id, order_number, buyer_id, seller_id, total_amount, status, order_type, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending_payment', 'package', ?)
    `).bind(orderId, orderNumber, user.id, (pkg as any).seller_id, (pkg as any).price, new Date().toISOString()).run();

    return c.json({ orderId, orderNumber });
  } catch (error) {
    return c.json({ success: false, error: { message: '购买失败' } }, 500);
  }
});

export default packageRoutes;
