import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';

const searchRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 热门型号
searchRoutes.get('/hot-inventories', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');

    const result = await c.env.DB.prepare(`
      SELECT id, part_number, name, price, quantity, status
      FROM inventory
      WHERE deleted_at IS NULL AND status = 'active'
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(limit).all();

    return c.json({
      success: true,
      data: result.results?.map((item: any) => ({
        id: item.id,
        partNumber: item.part_number,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        status: item.status,
      })) || [],
    });
  } catch (error) {
    console.error('获取热门库存错误:', error);
    return c.json({ success: true, data: [] });
  }
});

// 热门关键词
searchRoutes.get('/hot-keywords', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');

    // 返回示例关键词
    return c.json({
      success: true,
      data: [
        { keyword: 'STM32F103', count: 120 },
        { keyword: 'ESP32', count: 98 },
        { keyword: 'LM358', count: 76 },
        { keyword: 'NE555', count: 65 },
        { keyword: 'ATMEGA328', count: 54 },
      ],
    });
  } catch (error) {
    console.error('获取热门关键词错误:', error);
    return c.json({ success: true, data: [] });
  }
});

// 搜索历史
searchRoutes.get('/history', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: true, data: [] });
    }

    const limit = parseInt(c.req.query('limit') || '10');

    return c.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error('获取搜索历史错误:', error);
    return c.json({ success: true, data: [] });
  }
});

// 清除搜索历史
searchRoutes.delete('/history', authMiddleware, async (c) => {
  return c.json({ success: true, deletedCount: 0 });
});

// 推广库存
searchRoutes.get('/promoted-inventories', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '5');

    const result = await c.env.DB.prepare(`
      SELECT id, part_number, name, price, quantity, status
      FROM inventory
      WHERE deleted_at IS NULL AND status = 'active'
      ORDER BY price DESC
      LIMIT ?
    `).bind(limit).all();

    return c.json({
      success: true,
      data: result.results?.map((item: any) => ({
        id: item.id,
        partNumber: item.part_number,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        status: item.status,
      })) || [],
    });
  } catch (error) {
    console.error('获取推广库存错误:', error);
    return c.json({ success: true, data: [] });
  }
});

// 相似型号
searchRoutes.get('/similar/:partNumber', async (c) => {
  try {
    const partNumber = c.req.param('partNumber');
    const limit = parseInt(c.req.query('limit') || '5');

    const result = await c.env.DB.prepare(`
      SELECT id, part_number, name, price, quantity, status
      FROM inventory
      WHERE deleted_at IS NULL AND status = 'active' AND part_number LIKE ?
      LIMIT ?
    `).bind(`%${partNumber}%`, limit).all();

    return c.json({
      success: true,
      data: result.results?.map((item: any) => ({
        id: item.id,
        partNumber: item.part_number,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        status: item.status,
      })) || [],
    });
  } catch (error) {
    console.error('获取相似库存错误:', error);
    return c.json({ success: true, data: [] });
  }
});

export default searchRoutes;
