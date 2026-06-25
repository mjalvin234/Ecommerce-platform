import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const tieredPriceRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

tieredPriceRoutes.use('*', authMiddleware);

// 获取阶梯价格
tieredPriceRoutes.get('/:inventoryId', async (c) => {
  const { inventoryId } = c.req.param();

  try {
    const result = await c.env.DB.prepare(`
      SELECT id, min_quantity, max_quantity, price, created_at
      FROM tiered_prices
      WHERE inventory_id = ?
      ORDER BY min_quantity ASC
    `).bind(inventoryId).all();

    return c.json({
      items: result.results?.map((t: any) => ({
        id: t.id,
        minQuantity: t.min_quantity,
        maxQuantity: t.max_quantity,
        price: t.price,
        createdAt: t.created_at,
      })) || [],
    });
  } catch (error) {
    return c.json({ items: [] });
  }
});

// 设置阶梯价格
tieredPriceRoutes.post('/:inventoryId', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { inventoryId } = c.req.param();
  const { tiers } = await c.req.json();

  try {
    // 先删除旧的阶梯价格
    await c.env.DB.prepare(`
      DELETE FROM tiered_prices WHERE inventory_id = ?
    `).bind(inventoryId).run();

    // 插入新的阶梯价格
    for (const tier of tiers) {
      const id = uuidv4();
      await c.env.DB.prepare(`
        INSERT INTO tiered_prices (id, inventory_id, min_quantity, max_quantity, price, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(id, inventoryId, tier.minQuantity, tier.maxQuantity, tier.price, new Date().toISOString()).run();
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: { message: '设置失败' } }, 500);
  }
});

// 删除阶梯价格
tieredPriceRoutes.delete('/:inventoryId', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { inventoryId } = c.req.param();

  try {
    await c.env.DB.prepare(`
      DELETE FROM tiered_prices WHERE inventory_id = ?
    `).bind(inventoryId).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: { message: '删除失败' } }, 500);
  }
});

export default tieredPriceRoutes;
