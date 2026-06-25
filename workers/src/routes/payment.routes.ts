import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';

const paymentRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

paymentRoutes.use('*', authMiddleware);

// 获取支付渠道
paymentRoutes.get('/channels', async (c) => {
  return c.json([
    { channel: 'alipay', channelName: '支付宝', enabled: false, configured: false },
    { channel: 'wechat', channelName: '微信支付', enabled: false, configured: false },
  ]);
});

// 创建支付
paymentRoutes.post('/create', async (c) => {
  return c.json({
    paymentNo: `PAY-${Date.now()}`,
    expiredAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });
});

// 查询支付状态
paymentRoutes.get('/:paymentNo/status', async (c) => {
  return c.json({ status: 'pending' });
});

// 获取支付配置
paymentRoutes.get('/config', async (c) => {
  return c.json([]);
});

// 更新支付配置
paymentRoutes.put('/config/:channel', async (c) => {
  return c.json({ success: true });
});

// 测试支付配置
paymentRoutes.post('/config/:channel/test', async (c) => {
  return c.json({ success: false, message: '支付功能暂未配置' });
});

// 获取我的支付记录
paymentRoutes.get('/my', async (c) => {
  return c.json({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
});

export default paymentRoutes;
