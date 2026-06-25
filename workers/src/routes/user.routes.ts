import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';

const userRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 所有用户路由都需要认证
userRoutes.use('*', authMiddleware);

// 获取当前用户信息
userRoutes.get('/me', async (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json({
      success: false,
      error: { message: '未授权' },
    }, 401);
  }

  const result = await c.env.DB.prepare(
    'SELECT id, email, company_name, role, verification_status, credit_score, created_at FROM users WHERE id = ?'
  ).bind(user.id).first();

  if (!result) {
    return c.json({
      success: false,
      error: { message: '用户不存在' },
    }, 404);
  }

  return c.json({
    success: true,
    data: {
      id: result.id,
      email: result.email,
      companyName: result.company_name,
      role: result.role,
      verificationStatus: result.verification_status,
      creditScore: result.credit_score,
      createdAt: result.created_at,
    },
  });
});

// 更新用户信息
userRoutes.put('/me', async (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json({
      success: false,
      error: { message: '未授权' },
    }, 401);
  }

  const { companyName } = await c.req.json();

  if (!companyName) {
    return c.json({
      success: false,
      error: { message: '公司名称不能为空' },
    }, 400);
  }

  await c.env.DB.prepare(
    'UPDATE users SET company_name = ?, updated_at = ? WHERE id = ?'
  ).bind(companyName, new Date().toISOString(), user.id).run();

  return c.json({
    success: true,
    message: '更新成功',
  });
});

// 获取用户支付信息
userRoutes.get('/me/payment', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  try {
    const result = await c.env.DB.prepare(`
      SELECT payment_methods FROM users WHERE id = ?
    `).bind(user.id).first();

    // 返回默认支付方式
    return c.json({
      methods: result?.payment_methods ? JSON.parse(result.payment_methods as string) : [],
      defaultMethod: null,
    });
  } catch (error) {
    return c.json({ methods: [], defaultMethod: null });
  }
});

export default userRoutes;
