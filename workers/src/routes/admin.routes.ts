import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';

const adminRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 所有管理路由都需要先认证
adminRoutes.use('*', authMiddleware);

// 中间件：验证管理员权限
adminRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({
      success: false,
      error: { message: '需要管理员权限' },
    }, 403);
  }
  await next();
});

// 获取统计数据
adminRoutes.get('/statistics', async (c) => {
  try {
    // 用户统计
    const userStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN role = 'buyer' THEN 1 ELSE 0 END) as buyers,
        SUM(CASE WHEN role = 'seller' THEN 1 ELSE 0 END) as sellers,
        SUM(CASE WHEN DATE(created_at) = DATE('now') THEN 1 ELSE 0 END) as newToday,
        SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pendingVerification
      FROM users WHERE deleted_at IS NULL
    `).first();

    // 订单统计
    const orderStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN DATE(created_at) = DATE('now') THEN 1 ELSE 0 END) as newToday,
        SUM(CASE WHEN status = 'pending_payment' THEN 1 ELSE 0 END) as pendingPayment,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as pendingShipment,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM orders WHERE deleted_at IS NULL
    `).first();

    // 交易统计
    const transactionStats = await c.env.DB.prepare(`
      SELECT
        COALESCE(SUM(total_amount), 0) as totalAmount,
        COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now') THEN total_amount ELSE 0 END), 0) as todayAmount,
        COALESCE(SUM(CASE WHEN strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') THEN total_amount ELSE 0 END), 0) as monthAmount
      FROM orders WHERE deleted_at IS NULL AND status != 'cancelled'
    `).first();

    // 库存统计
    const inventoryStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
      FROM inventory WHERE deleted_at IS NULL
    `).first();

    // 议价统计
    const negotiationStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM negotiations WHERE deleted_at IS NULL
    `).first();

    return c.json({
      success: true,
      data: {
        users: {
          total: userStats?.total || 0,
          buyers: userStats?.buyers || 0,
          sellers: userStats?.sellers || 0,
          newToday: userStats?.newToday || 0,
          pendingVerification: userStats?.pendingVerification || 0,
        },
        orders: {
          total: orderStats?.total || 0,
          newToday: orderStats?.newToday || 0,
          pendingPayment: orderStats?.pendingPayment || 0,
          pendingShipment: orderStats?.pendingShipment || 0,
          completed: orderStats?.completed || 0,
        },
        transactions: {
          totalAmount: transactionStats?.totalAmount || 0,
          todayAmount: transactionStats?.todayAmount || 0,
          monthAmount: transactionStats?.monthAmount || 0,
        },
        inventory: {
          total: inventoryStats?.total || 0,
          active: inventoryStats?.active || 0,
        },
        negotiations: {
          total: negotiationStats?.total || 0,
          pending: negotiationStats?.pending || 0,
        },
      },
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    return c.json({
      success: false,
      error: { message: '获取统计数据失败' },
    }, 500);
  }
});

// 获取用户列表
adminRoutes.get('/users', async (c) => {
  try {
    const { role, verificationStatus, page = '1', pageSize = '20' } = c.req.query();
    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    let sql = 'SELECT id, email, company_name, role, verification_status, credit_score, anonymous_hash, created_at FROM users WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (verificationStatus) {
      sql += ' AND verification_status = ?';
      params.push(verificationStatus);
    }

    // 获取总数
    const countSql = sql.replace('SELECT id, email, company_name, role, verification_status, credit_score, anonymous_hash, created_at', 'SELECT COUNT(*) as total');
    const countResult = await c.env.DB.prepare(countSql).bind(...params).first();
    const total = countResult?.total || 0;

    // 分页查询
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const result = await c.env.DB.prepare(sql).bind(...params).all();

    return c.json({
      success: true,
      data: {
        items: result.results?.map((u: any) => ({
          id: u.id,
          email: u.email,
          companyName: u.company_name,
          role: u.role,
          verificationStatus: u.verification_status,
          creditScore: u.credit_score,
          anonymousHash: u.anonymous_hash,
          createdAt: u.created_at,
        })) || [],
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        totalPages: Math.ceil(Number(total) / parseInt(pageSize as string)),
      },
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    return c.json({
      success: false,
      error: { message: '获取用户列表失败' },
    }, 500);
  }
});

// 更新用户状态
adminRoutes.patch('/users/:id/status', async (c) => {
  try {
    const { id } = c.req.param();
    const { verificationStatus, creditScore } = await c.req.json();

    const updates: string[] = [];
    const params: any[] = [];

    if (verificationStatus) {
      updates.push('verification_status = ?');
      params.push(verificationStatus);
    }
    if (creditScore !== undefined) {
      updates.push('credit_score = ?');
      params.push(creditScore);
    }

    if (updates.length === 0) {
      return c.json({
        success: false,
        error: { message: '没有要更新的内容' },
      }, 400);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await c.env.DB.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    return c.json({
      success: true,
      data: { success: true },
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    return c.json({
      success: false,
      error: { message: '更新用户状态失败' },
    }, 500);
  }
});

// 删除用户（软删除）
adminRoutes.delete('/users/:id', async (c) => {
  try {
    const { id } = c.req.param();

    await c.env.DB.prepare(
      'UPDATE users SET deleted_at = ?, updated_at = ? WHERE id = ?'
    ).bind(new Date().toISOString(), new Date().toISOString(), id).run();

    return c.json({
      success: true,
      data: { success: true, softDelete: true },
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    return c.json({
      success: false,
      error: { message: '删除用户失败' },
    }, 500);
  }
});

// 获取所有订单
adminRoutes.get('/orders', async (c) => {
  try {
    const { status, page = '1', pageSize = '20' } = c.req.query();
    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    let sql = `
      SELECT o.id, o.order_number, o.part_number, o.quantity, o.total_amount, o.status, o.order_type,
             o.buyer_id, o.seller_id, o.created_at,
             b.company_name as buyer_name, s.company_name as seller_name
      FROM orders o
      LEFT JOIN users b ON o.buyer_id = b.id
      LEFT JOIN users s ON o.seller_id = s.id
      WHERE o.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const countResult = await c.env.DB.prepare(countSql).bind(...params).first();
    const total = countResult?.total || 0;

    // 分页查询
    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const result = await c.env.DB.prepare(sql).bind(...params).all();

    return c.json({
      success: true,
      data: {
        items: result.results?.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          partNumber: o.part_number,
          quantity: o.quantity,
          totalAmount: o.total_amount,
          status: o.status,
          orderType: o.order_type,
          buyer: o.buyer_id ? { id: o.buyer_id, companyName: o.buyer_name } : null,
          seller: o.seller_id ? { id: o.seller_id, companyName: o.seller_name } : null,
          createdAt: o.created_at,
        })) || [],
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        totalPages: Math.ceil(Number(total) / parseInt(pageSize as string)),
      },
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    return c.json({
      success: false,
      error: { message: '获取订单列表失败' },
    }, 500);
  }
});

// 订单趋势
adminRoutes.get('/trend/orders', async (c) => {
  try {
    const { days = '7' } = c.req.query();
    const daysNum = parseInt(days);

    const result = await c.env.DB.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM orders
      WHERE deleted_at IS NULL
        AND created_at >= DATE('now', '-' || ? || ' days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).bind(daysNum).all();

    return c.json({
      success: true,
      data: result.results || [],
    });
  } catch (error) {
    console.error('获取订单趋势错误:', error);
    return c.json({
      success: false,
      error: { message: '获取订单趋势失败' },
    }, 500);
  }
});

// 热门型号
adminRoutes.get('/top-models', async (c) => {
  try {
    const { limit = '10' } = c.req.query();

    const result = await c.env.DB.prepare(`
      SELECT part_number, COUNT(*) as count
      FROM orders
      WHERE deleted_at IS NULL
      GROUP BY part_number
      ORDER BY count DESC
      LIMIT ?
    `).bind(parseInt(limit)).all();

    return c.json({
      success: true,
      data: result.results || [],
    });
  } catch (error) {
    console.error('获取热门型号错误:', error);
    return c.json({
      success: false,
      error: { message: '获取热门型号失败' },
    }, 500);
  }
});

// 认证审核统计
adminRoutes.get('/certification/stats', async (c) => {
  try {
    const stats = await c.env.DB.prepare(`
      SELECT
        SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN verification_status = 'verified' AND DATE(updated_at) = DATE('now') THEN 1 ELSE 0 END) as approvedToday,
        SUM(CASE WHEN verification_status = 'rejected' AND DATE(updated_at) = DATE('now') THEN 1 ELSE 0 END) as rejectedToday
      FROM users
      WHERE deleted_at IS NULL
    `).first();

    return c.json({
      success: true,
      data: {
        pending: stats?.pending || 0,
        approvedToday: stats?.approvedToday || 0,
        rejectedToday: stats?.rejectedToday || 0,
      },
    });
  } catch (error) {
    console.error('获取认证统计错误:', error);
    return c.json({
      success: false,
      error: { message: '获取认证统计失败' },
    }, 500);
  }
});

export default adminRoutes;
