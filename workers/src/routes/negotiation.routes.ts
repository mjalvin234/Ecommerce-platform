import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { v4 as uuidv4 } from 'uuid';

const negotiationRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 中间件：验证登录
negotiationRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: { message: '请先登录' } }, 401);
  }
  await next();
});

// 创建议价
negotiationRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

    const { inventoryId, offerPrice, quantity } = await c.req.json();

    if (!inventoryId || !offerPrice || !quantity) {
      return c.json({ success: false, error: { message: '请填写完整信息' } }, 400);
    }

    // 获取库存信息
    const inventory = await c.env.DB.prepare(
      'SELECT * FROM inventory WHERE id = ? AND deleted_at IS NULL'
    ).bind(inventoryId).first() as any;

    if (!inventory) {
      return c.json({ success: false, error: { message: '库存不存在' } }, 404);
    }

    if (inventory.seller_id === user.id) {
      return c.json({ success: false, error: { message: '不能议价自己的库存' } }, 400);
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO negotiations (id, inventory_id, buyer_id, seller_id, seller_price, offer_price, quantity, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(id, inventoryId, user.id, inventory.seller_id, inventory.price, offerPrice, quantity, now, now).run();

    return c.json({
      success: true,
      data: {
        id,
        partNumber: inventory.part_number,
        sellerPrice: inventory.price,
        offerPrice,
        quantity,
        status: 'pending',
        createdAt: now,
      },
    });
  } catch (error) {
    console.error('创建议价错误:', error);
    return c.json({ success: false, error: { message: '创建议价失败' } }, 500);
  }
});

// 获取议价历史（根据用户角色返回）
negotiationRoutes.get('/history', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

    const status = c.req.query('status') || '';

    let whereClause = 'WHERE (n.buyer_id = ? OR n.seller_id = ?) AND n.deleted_at IS NULL';
    const params: any[] = [user.id, user.id];

    if (status && status !== 'all') {
      whereClause += ' AND n.status = ?';
      params.push(status);
    }

    const result = await c.env.DB.prepare(`
      SELECT n.*, i.part_number as inventory_part_number,
             b.company_name as buyer_name, s.company_name as seller_name
      FROM negotiations n
      LEFT JOIN inventory i ON n.inventory_id = i.id
      LEFT JOIN users b ON n.buyer_id = b.id
      LEFT JOIN users s ON n.seller_id = s.id
      ${whereClause}
      ORDER BY n.created_at DESC
    `).bind(...params).all();

    return c.json({
      negotiations: result.results?.map((n: any) => ({
        id: n.id,
        inventoryId: n.inventory_id,
        inventoryPartNumber: n.inventory_part_number,
        sellerId: n.seller_id,
        sellerName: n.seller_name,
        buyerId: n.buyer_id,
        buyerName: n.buyer_name,
        originalPrice: n.seller_price,
        proposedPrice: n.offer_price,
        quantity: n.quantity,
        status: n.status,
        createdAt: n.created_at,
      })) || [],
    });
  } catch (error) {
    console.error('获取议价历史错误:', error);
    return c.json({ negotiations: [] });
  }
});

// 获取买家的议价列表
negotiationRoutes.get('/buyer', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

    const result = await c.env.DB.prepare(`
      SELECT n.*, i.part_number, u.company_name as seller_name
      FROM negotiations n
      LEFT JOIN inventory i ON n.inventory_id = i.id
      LEFT JOIN users u ON n.seller_id = u.id
      WHERE n.buyer_id = ? AND n.deleted_at IS NULL
      ORDER BY n.created_at DESC
    `).bind(user.id).all();

    return c.json({
      success: true,
      data: result.results?.map((n: any) => ({
        id: n.id,
        partNumber: n.part_number,
        sellerPrice: n.seller_price,
        offerPrice: n.offer_price,
        quantity: n.quantity,
        status: n.status,
        seller: n.seller_name,
        createdAt: n.created_at,
      })) || [],
    });
  } catch (error) {
    console.error('获取买家议价错误:', error);
    return c.json({ success: false, error: { message: '获取买家议价失败' } }, 500);
  }
});

// 获取卖家的议价列表
negotiationRoutes.get('/seller', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

    const result = await c.env.DB.prepare(`
      SELECT n.*, i.part_number, u.company_name as buyer_name
      FROM negotiations n
      LEFT JOIN inventory i ON n.inventory_id = i.id
      LEFT JOIN users u ON n.buyer_id = u.id
      WHERE n.seller_id = ? AND n.deleted_at IS NULL
      ORDER BY n.created_at DESC
    `).bind(user.id).all();

    return c.json({
      success: true,
      data: result.results?.map((n: any) => ({
        id: n.id,
        partNumber: n.part_number,
        sellerPrice: n.seller_price,
        offerPrice: n.offer_price,
        quantity: n.quantity,
        status: n.status,
        buyer: n.buyer_name,
        createdAt: n.created_at,
      })) || [],
    });
  } catch (error) {
    console.error('获取卖家议价错误:', error);
    return c.json({ success: false, error: { message: '获取卖家议价失败' } }, 500);
  }
});

// 接受议价
negotiationRoutes.post('/:id/accept', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

    const { id } = c.req.param();
    const negotiation = await c.env.DB.prepare(
      'SELECT * FROM negotiations WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first() as any;

    if (!negotiation) {
      return c.json({ success: false, error: { message: '议价不存在' } }, 404);
    }

    if (negotiation.seller_id !== user.id) {
      return c.json({ success: false, error: { message: '只有卖家可以接受议价' } }, 403);
    }

    if (negotiation.status !== 'pending') {
      return c.json({ success: false, error: { message: '该议价已处理' } }, 400);
    }

    // 创建订单
    const orderId = uuidv4();
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const offerPrice = negotiation.offer_price as number;
    const qty = negotiation.quantity as number;
    const totalAmount = offerPrice * qty;
    const now = new Date().toISOString();

    await c.env.DB.batch([
      // 更新议价状态
      c.env.DB.prepare('UPDATE negotiations SET status = ?, updated_at = ? WHERE id = ?')
        .bind('accepted', now, id),
      // 创建订单
      c.env.DB.prepare(`
        INSERT INTO orders (id, order_number, inventory_id, buyer_id, seller_id, part_number, quantity, unit_price, total_amount, status, order_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', 'negotiated', ?, ?)
      `).bind(orderId, orderNumber, negotiation.inventory_id, negotiation.buyer_id, negotiation.seller_id, '', qty, offerPrice, totalAmount, now, now),
    ]);

    return c.json({
      success: true,
      data: { success: true, orderId, orderNumber },
    });
  } catch (error) {
    console.error('接受议价错误:', error);
    return c.json({ success: false, error: { message: '接受议价失败' } }, 500);
  }
});

// 拒绝议价
negotiationRoutes.post('/:id/reject', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

    const { id } = c.req.param();
    const negotiation = await c.env.DB.prepare(
      'SELECT * FROM negotiations WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first() as any;

    if (!negotiation) {
      return c.json({ success: false, error: { message: '议价不存在' } }, 404);
    }

    if (negotiation.seller_id !== user.id) {
      return c.json({ success: false, error: { message: '只有卖家可以拒绝议价' } }, 403);
    }

    if (negotiation.status !== 'pending') {
      return c.json({ success: false, error: { message: '该议价已处理' } }, 400);
    }

    await c.env.DB.prepare(
      'UPDATE negotiations SET status = ?, updated_at = ? WHERE id = ?'
    ).bind('rejected', new Date().toISOString(), id).run();

    return c.json({ success: true, data: { success: true } });
  } catch (error) {
    console.error('拒绝议价错误:', error);
    return c.json({ success: false, error: { message: '拒绝议价失败' } }, 500);
  }
});

export default negotiationRoutes;
