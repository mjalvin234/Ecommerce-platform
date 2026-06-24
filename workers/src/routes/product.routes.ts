import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const productRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 获取产品列表（公开）
productRoutes.get('/', async (c) => {
  const { category, search, page = '1', limit = '10' } = c.req.query();

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = 'SELECT * FROM inventory WHERE quantity > 0 AND deleted_at IS NULL';
  const params: any[] = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const results = await c.env.DB.prepare(sql).bind(...params).all();

  return c.json({
    success: true,
    data: results.results,
  });
});

// 获取产品详情（公开）
productRoutes.get('/:id', async (c) => {
  const productId = c.req.param('id');

  const product = await c.env.DB.prepare(
    'SELECT * FROM inventory WHERE id = ? AND deleted_at IS NULL'
  ).bind(productId).first();

  if (!product) {
    return c.json({
      success: false,
      error: { message: '产品不存在' },
    }, 404);
  }

  return c.json({
    success: true,
    data: product,
  });
});

// 创建产品（需要认证）
productRoutes.post('/', authMiddleware, async (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json({
      success: false,
      error: { message: '未授权' },
    }, 401);
  }

  const { name, description, category, quantity, price, unit } = await c.req.json();

  // 验证必填字段
  if (!name || !quantity || !price) {
    return c.json({
      success: false,
      error: { message: '请填写完整的产品信息' },
    }, 400);
  }

  const { v4: uuidv4 } = await import('uuid');
  const id = uuidv4();

  await c.env.DB.prepare(`
    INSERT INTO inventory (id, name, description, category, quantity, price, unit, seller_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    name,
    description,
    category,
    quantity,
    price,
    unit || '件',
    user.id,
    new Date().toISOString(),
    new Date().toISOString()
  ).run();

  return c.json({
    success: true,
    data: { id },
    message: '产品创建成功',
  });
});

export default productRoutes;
