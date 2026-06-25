import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { v4 as uuidv4 } from 'uuid';

const inventoryRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 搜索库存（公开）
inventoryRoutes.get('/', async (c) => {
  try {
    const { q = '', page = '1', pageSize = '20' } = c.req.query();
    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    let sql = `
      SELECT i.*, u.company_name as supplier_name
      FROM inventory i
      LEFT JOIN users u ON i.seller_id = u.id
      WHERE i.deleted_at IS NULL AND i.status = 'active'
    `;
    const params: any[] = [];

    if (q) {
      sql += ' AND (i.part_number LIKE ? OR i.description LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const countResult = await c.env.DB.prepare(countSql).bind(...params).first();
    const total = countResult?.total || 0;

    // 分页查询
    sql += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize as string), offset);

    const result = await c.env.DB.prepare(sql).bind(...params).all();

    return c.json({
      success: true,
      data: {
        items: result.results?.map((i: any) => ({
          id: i.id,
          partNumber: i.part_number,
          quantity: i.quantity,
          availableQty: i.available_qty,
          year: i.year,
          price: i.price,
          eccn: i.eccn,
          leadTime: i.lead_time,
          status: i.status,
          supplier: i.supplier_name,
        })) || [],
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        totalPages: Math.ceil(Number(total) / parseInt(pageSize as string)),
      },
    });
  } catch (error) {
    console.error('搜索库存错误:', error);
    return c.json({ success: false, error: { message: '搜索库存失败' } }, 500);
  }
});

// 获取单个库存详情
inventoryRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const result = await c.env.DB.prepare(`
      SELECT i.*, u.company_name as supplier_name
      FROM inventory i
      LEFT JOIN users u ON i.seller_id = u.id
      WHERE i.id = ? AND i.deleted_at IS NULL
    `).bind(id).first() as any;

    if (!result) {
      return c.json({ success: false, error: { message: '库存不存在' } }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: result.id,
        partNumber: result.part_number,
        quantity: result.quantity,
        availableQty: result.available_qty,
        year: result.year,
        price: result.price,
        eccn: result.eccn,
        leadTime: result.lead_time,
        status: result.status,
        supplier: result.supplier_name,
      },
    });
  } catch (error) {
    console.error('获取库存详情错误:', error);
    return c.json({ success: false, error: { message: '获取库存详情失败' } }, 500);
  }
});

// 中间件：验证登录
inventoryRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: { message: '请先登录' } }, 401);
  }
  await next();
});

// 获取卖家的库存列表
inventoryRoutes.get('/seller/my', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

    const result = await c.env.DB.prepare(`
      SELECT * FROM inventory
      WHERE seller_id = ? AND deleted_at IS NULL
      ORDER BY created_at DESC
    `).bind(user.id).all();

    // 获取卖家信息
    const sellerInfo = await c.env.DB.prepare(
      'SELECT company_name FROM users WHERE id = ?'
    ).bind(user.id).first() as any;

    return c.json({
      success: true,
      data: result.results?.map((i: any) => ({
        id: i.id,
        partNumber: i.part_number,
        quantity: i.quantity,
        availableQty: i.available_qty,
        year: i.year,
        price: i.price,
        eccn: i.eccn,
        leadTime: i.lead_time,
        status: i.status,
        supplier: sellerInfo?.company_name || '',
      })) || [],
    });
  } catch (error) {
    console.error('获取卖家库存错误:', error);
    return c.json({ success: false, error: { message: '获取卖家库存失败' } }, 500);
  }
});

// 创建库存
inventoryRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

    if (user.role !== 'seller') {
      return c.json({ success: false, error: { message: '只有卖家可以创建库存' } }, 403);
    }

    const { partNumber, quantity, year, price, eccn, leadTime } = await c.req.json();

    if (!partNumber || !quantity || !price) {
      return c.json({ success: false, error: { message: '请填写完整信息' } }, 400);
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO inventory (id, seller_id, part_number, quantity, available_qty, year, price, eccn, lead_time, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).bind(id, user.id, partNumber, quantity, quantity, year, price, eccn, leadTime, now, now).run();

    return c.json({
      success: true,
      data: {
        id,
        partNumber,
        quantity,
        availableQty: quantity,
        year,
        price,
        eccn,
        leadTime,
        status: 'active',
      },
    });
  } catch (error) {
    console.error('创建库存错误:', error);
    return c.json({ success: false, error: { message: '创建库存失败' } }, 500);
  }
});

// 更新库存
inventoryRoutes.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

    const { id } = c.req.param();
    const { partNumber, quantity, year, price, eccn, leadTime, status } = await c.req.json();

    // 验证所有权
    const existing = await c.env.DB.prepare(
      'SELECT * FROM inventory WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first() as any;

    if (!existing) {
      return c.json({ success: false, error: { message: '库存不存在' } }, 404);
    }

    if (existing.seller_id !== user.id && user.role !== 'admin') {
      return c.json({ success: false, error: { message: '无权限修改此库存' } }, 403);
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (partNumber !== undefined) { updates.push('part_number = ?'); params.push(partNumber); }
    if (quantity !== undefined) { updates.push('quantity = ?'); params.push(quantity); }
    if (year !== undefined) { updates.push('year = ?'); params.push(year); }
    if (price !== undefined) { updates.push('price = ?'); params.push(price); }
    if (eccn !== undefined) { updates.push('eccn = ?'); params.push(eccn); }
    if (leadTime !== undefined) { updates.push('lead_time = ?'); params.push(leadTime); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (updates.length === 0) {
      return c.json({ success: false, error: { message: '没有要更新的内容' } }, 400);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await c.env.DB.prepare(`UPDATE inventory SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

    return c.json({ success: true, data: { success: true } });
  } catch (error) {
    console.error('更新库存错误:', error);
    return c.json({ success: false, error: { message: '更新库存失败' } }, 500);
  }
});

// 删除库存
inventoryRoutes.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

    const { id } = c.req.param();

    // 验证所有权
    const existing = await c.env.DB.prepare(
      'SELECT * FROM inventory WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first() as any;

    if (!existing) {
      return c.json({ success: false, error: { message: '库存不存在' } }, 404);
    }

    if (existing.seller_id !== user.id && user.role !== 'admin') {
      return c.json({ success: false, error: { message: '无权限删除此库存' } }, 403);
    }

    await c.env.DB.prepare(
      'UPDATE inventory SET deleted_at = ?, updated_at = ? WHERE id = ?'
    ).bind(new Date().toISOString(), new Date().toISOString(), id).run();

    return c.json({ success: true, data: { success: true } });
  } catch (error) {
    console.error('删除库存错误:', error);
    return c.json({ success: false, error: { message: '删除库存失败' } }, 500);
  }
});

export default inventoryRoutes;
