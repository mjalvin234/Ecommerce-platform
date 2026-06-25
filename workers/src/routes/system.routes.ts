import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';

const systemRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 获取公开系统配置
systemRoutes.get('/public', async (c) => {
  try {
    // 返回公开的系统配置
    return c.json({
      success: true,
      data: {
        siteName: '芯片交易平台',
        siteDescription: '专业的电子元器件交易平台',
        contactEmail: 'support@example.com',
        contactPhone: '400-123-4567',
        version: '1.0.0',
        features: {
          negotiation: true,
          qa: true,
          invoice: true,
        },
      },
    });
  } catch (error) {
    console.error('获取系统配置错误:', error);
    return c.json({ success: false, error: { message: '获取系统配置失败' } }, 500);
  }
});

// 获取完整系统配置（需要管理员权限）
systemRoutes.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    if (user.role !== 'admin') {
      return c.json({ success: false, error: { message: '权限不足' } }, 403);
    }

    return c.json({
      success: true,
      data: {
        siteName: '芯片交易平台',
        siteDescription: '专业的电子元器件交易平台',
        contactEmail: 'support@example.com',
        contactPhone: '400-123-4567',
        version: '1.0.0',
        features: {
          negotiation: true,
          qa: true,
          invoice: true,
        },
        paymentMethods: ['alipay', 'wechat', 'bank'],
        shippingMethods: ['express', 'logistics'],
      },
    });
  } catch (error) {
    console.error('获取系统配置错误:', error);
    return c.json({ success: false, error: { message: '获取系统配置失败' } }, 500);
  }
});

// 更新系统配置
systemRoutes.put('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    if (user.role !== 'admin') {
      return c.json({ success: false, error: { message: '权限不足' } }, 403);
    }

    const body = await c.req.json();

    return c.json({
      success: true,
      message: '配置已更新',
    });
  } catch (error) {
    console.error('更新系统配置错误:', error);
    return c.json({ success: false, error: { message: '更新系统配置失败' } }, 500);
  }
});

// 重置系统配置
systemRoutes.post('/reset', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    if (user.role !== 'admin') {
      return c.json({ success: false, error: { message: '权限不足' } }, 403);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('重置系统配置错误:', error);
    return c.json({ success: false, error: { message: '重置系统配置失败' } }, 500);
  }
});

export default systemRoutes;
