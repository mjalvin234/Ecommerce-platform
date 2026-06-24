import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth.middleware';

const orderRoutes = new Hono();

orderRoutes.use('*', authMiddleware);

// 获取订单列表
orderRoutes.get('/', async (c) => {
  const user = c.get('user');
  const { status, page = '1', limit = '10' } = c.req.query();

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = 'SELECT * FROM orders WHERE (buyer_id = ? OR seller_id = ?) AND deleted_at IS NULL';
  const params: any[] = [user.id, user.id];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const results = await c.env.DB.prepare(sql).bind(...params).all();

  // 获取总数
  let countSql = 'SELECT COUNT(*) as total FROM orders WHERE (buyer_id = ? OR seller_id = ?) AND deleted_at IS NULL';
  const countParams: any[] = [user.id, user.id];

  if (status) {
    countSql += ' AND status = ?';
    countParams.push(status);
  }

  const countResult = await c.env.DB.prepare(countSql).bind(...countParams).first();

  return c.json({
    success: true,
    data: {
      orders: results.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult?.total || 0,
      },
    },
  });
});

// 获取订单详情
orderRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const orderId = c.req.param('id');

  const order = await c.env.DB.prepare(
    'SELECT * FROM orders WHERE id = ? AND (buyer_id = ? OR seller_id = ?) AND deleted_at IS NULL'
  ).bind(orderId, user.id, user.id).first();

  if (!order) {
    return c.json({
      success: false,
      error: { message: '订单不存在' },
    }, 404);
  }

  return c.json({
    success: true,
    data: order,
  });
});

export default orderRoutes;
