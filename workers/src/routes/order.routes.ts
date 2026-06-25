import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const orderRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

orderRoutes.use('*', authMiddleware);

// 创建订单
orderRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    const { inventoryId, quantity, type = 'direct' } = await c.req.json();

    if (!inventoryId || !quantity) {
      return c.json({ success: false, error: { message: '请填写完整信息' } }, 400);
    }

    // 获取库存信息
    const inventory = await c.env.DB.prepare(
      'SELECT * FROM inventory WHERE id = ? AND deleted_at IS NULL AND status = ?'
    ).bind(inventoryId, 'active').first() as any;

    if (!inventory) {
      return c.json({ success: false, error: { message: '库存不存在或已下架' } }, 404);
    }

    if (inventory.seller_id === user.id) {
      return c.json({ success: false, error: { message: '不能购买自己的库存' } }, 400);
    }

    const availableQty = inventory.available_qty || inventory.quantity || 0;
    if (availableQty < quantity) {
      return c.json({ success: false, error: { message: '库存不足' } }, 400);
    }

    const id = uuidv4();
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const price = inventory.price || 0;
    const totalAmount = price * quantity;
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO orders (id, order_number, buyer_id, seller_id, inventory_id, part_number, product_name, quantity, unit_price, total_amount, status, order_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', ?, ?, ?)
    `).bind(id, orderNumber, user.id, inventory.seller_id, inventoryId, inventory.part_number, inventory.name || inventory.part_number, quantity, price, totalAmount, type, now, now).run();

    // 更新库存可用数量
    await c.env.DB.prepare(
      'UPDATE inventory SET available_qty = available_qty - ?, updated_at = ? WHERE id = ?'
    ).bind(quantity, now, inventoryId).run();

    return c.json({
      success: true,
      data: {
        id,
        orderNumber,
        partNumber: inventory.part_number,
        quantity,
        totalAmount,
        status: 'pending_payment',
        orderType: type,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    return c.json({ success: false, error: { message: '创建订单失败' } }, 500);
  }
});

// 获取买家订单
orderRoutes.get('/buyer', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    const result = await c.env.DB.prepare(`
      SELECT o.*, u.company_name as seller_name
      FROM orders o
      LEFT JOIN users u ON o.seller_id = u.id
      WHERE o.buyer_id = ? AND o.deleted_at IS NULL
      ORDER BY o.created_at DESC
    `).bind(user.id).all();

    return c.json({
      success: true,
      data: result.results?.map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        partNumber: o.part_number || o.product_name,
        quantity: o.quantity,
        totalAmount: o.total_amount,
        status: o.status,
        orderType: o.order_type,
        seller: o.seller_name,
        createdAt: o.created_at,
      })) || [],
    });
  } catch (error) {
    console.error('获取买家订单错误:', error);
    return c.json({ success: false, error: { message: '获取买家订单失败' } }, 500);
  }
});

// 获取卖家订单
orderRoutes.get('/seller', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    const result = await c.env.DB.prepare(`
      SELECT o.*, u.company_name as buyer_name
      FROM orders o
      LEFT JOIN users u ON o.buyer_id = u.id
      WHERE o.seller_id = ? AND o.deleted_at IS NULL
      ORDER BY o.created_at DESC
    `).bind(user.id).all();

    return c.json({
      success: true,
      data: result.results?.map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        partNumber: o.part_number || o.product_name,
        quantity: o.quantity,
        totalAmount: o.total_amount,
        status: o.status,
        orderType: o.order_type,
        buyer: o.buyer_name,
        createdAt: o.created_at,
      })) || [],
    });
  } catch (error) {
    console.error('获取卖家订单错误:', error);
    return c.json({ success: false, error: { message: '获取卖家订单失败' } }, 500);
  }
});

// 获取订单详情
orderRoutes.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    const { id } = c.req.param();
    const result = await c.env.DB.prepare(`
      SELECT o.*, b.company_name as buyer_name, s.company_name as seller_name
      FROM orders o
      LEFT JOIN users b ON o.buyer_id = b.id
      LEFT JOIN users s ON o.seller_id = s.id
      WHERE o.id = ? AND (o.buyer_id = ? OR o.seller_id = ?) AND o.deleted_at IS NULL
    `).bind(id, user.id, user.id).first() as any;

    if (!result) {
      return c.json({ success: false, error: { message: '订单不存在' } }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: result.id,
        orderNumber: result.order_number,
        partNumber: result.part_number || result.product_name,
        quantity: result.quantity,
        totalAmount: result.total_amount,
        status: result.status,
        orderType: result.order_type,
        buyer: { id: result.buyer_id, companyName: result.buyer_name },
        seller: { id: result.seller_id, companyName: result.seller_name },
        createdAt: result.created_at,
      },
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    return c.json({ success: false, error: { message: '获取订单详情失败' } }, 500);
  }
});

// 支付订单
orderRoutes.post('/:id/pay', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    const { id } = c.req.param();
    const order = await c.env.DB.prepare(
      'SELECT * FROM orders WHERE id = ? AND buyer_id = ? AND deleted_at IS NULL'
    ).bind(id, user.id).first() as any;

    if (!order) {
      return c.json({ success: false, error: { message: '订单不存在' } }, 404);
    }

    if (order.status !== 'pending_payment') {
      return c.json({ success: false, error: { message: '订单状态不正确' } }, 400);
    }

    await c.env.DB.prepare(
      'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?'
    ).bind('paid', new Date().toISOString(), id).run();

    return c.json({ success: true, data: { success: true, status: 'paid' } });
  } catch (error) {
    console.error('支付订单错误:', error);
    return c.json({ success: false, error: { message: '支付订单失败' } }, 500);
  }
});

// 发货
orderRoutes.post('/:id/ship', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    const { id } = c.req.param();
    const { carrier, trackingNumber } = await c.req.json();

    if (!carrier || !trackingNumber) {
      return c.json({ success: false, error: { message: '请填写物流信息' } }, 400);
    }

    const order = await c.env.DB.prepare(
      'SELECT * FROM orders WHERE id = ? AND seller_id = ? AND deleted_at IS NULL'
    ).bind(id, user.id).first() as any;

    if (!order) {
      return c.json({ success: false, error: { message: '订单不存在' } }, 404);
    }

    if (order.status !== 'paid') {
      return c.json({ success: false, error: { message: '订单状态不正确' } }, 400);
    }

    await c.env.DB.prepare(
      'UPDATE orders SET status = ?, tracking_number = ?, updated_at = ? WHERE id = ?'
    ).bind('shipped', trackingNumber, new Date().toISOString(), id).run();

    return c.json({ success: true, data: { success: true, status: 'shipped' } });
  } catch (error) {
    console.error('发货错误:', error);
    return c.json({ success: false, error: { message: '发货失败' } }, 500);
  }
});

// 确认收货
orderRoutes.post('/:id/complete', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    const { id } = c.req.param();
    const order = await c.env.DB.prepare(
      'SELECT * FROM orders WHERE id = ? AND buyer_id = ? AND deleted_at IS NULL'
    ).bind(id, user.id).first() as any;

    if (!order) {
      return c.json({ success: false, error: { message: '订单不存在' } }, 404);
    }

    if (order.status !== 'shipped') {
      return c.json({ success: false, error: { message: '订单状态不正确' } }, 400);
    }

    await c.env.DB.prepare(
      'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?'
    ).bind('completed', new Date().toISOString(), id).run();

    return c.json({ success: true, data: { success: true, status: 'completed' } });
  } catch (error) {
    console.error('确认收货错误:', error);
    return c.json({ success: false, error: { message: '确认收货失败' } }, 500);
  }
});

// 取消订单
orderRoutes.post('/:id/cancel', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    const { id } = c.req.param();
    const order = await c.env.DB.prepare(
      'SELECT * FROM orders WHERE id = ? AND (buyer_id = ? OR seller_id = ?) AND deleted_at IS NULL'
    ).bind(id, user.id, user.id).first() as any;

    if (!order) {
      return c.json({ success: false, error: { message: '订单不存在' } }, 404);
    }

    if (!['pending_payment', 'paid'].includes(order.status)) {
      return c.json({ success: false, error: { message: '订单状态不允许取消' } }, 400);
    }

    // 恢复库存
    if (order.inventory_id) {
      await c.env.DB.prepare(
        'UPDATE inventory SET available_qty = available_qty + ?, updated_at = ? WHERE id = ?'
      ).bind(order.quantity, new Date().toISOString(), order.inventory_id).run();
    }

    await c.env.DB.prepare(
      'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?'
    ).bind('cancelled', new Date().toISOString(), id).run();

    return c.json({ success: true, data: { success: true, status: 'cancelled' } });
  } catch (error) {
    console.error('取消订单错误:', error);
    return c.json({ success: false, error: { message: '取消订单失败' } }, 500);
  }
});

export default orderRoutes;
