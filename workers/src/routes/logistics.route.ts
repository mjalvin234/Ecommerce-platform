import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';

const logisticsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

logisticsRoutes.use('*', authMiddleware);

// 自动检测快递公司
logisticsRoutes.get('/auto-detect/:trackingNumber', async (c) => {
  const { trackingNumber } = c.req.param();

  // 简单的快递单号识别
  const carriers: { [key: string]: { carrier: string; carrierCode: string } } = {
    'SF': { carrier: '顺丰速运', carrierCode: 'SF' },
    'YTO': { carrier: '圆通速递', carrierCode: 'YTO' },
    'ZTO': { carrier: '中通快递', carrierCode: 'ZTO' },
    'STO': { carrier: '申通快递', carrierCode: 'STO' },
    'YD': { carrier: '韵达快递', carrierCode: 'YD' },
    'EMS': { carrier: 'EMS', carrierCode: 'EMS' },
    'JD': { carrier: '京东物流', carrierCode: 'JD' },
  };

  // 根据单号前缀匹配
  for (const [prefix, info] of Object.entries(carriers)) {
    if (trackingNumber.startsWith(prefix) || trackingNumber.toUpperCase().startsWith(prefix)) {
      return c.json(info);
    }
  }

  // 默认返回 null
  return c.json(null);
});

// 提交物流信息
logisticsRoutes.post('/submit', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { orderId, carrier, carrierCode, trackingNumber } = await c.req.json();

  try {
    await c.env.DB.prepare(`
      UPDATE orders
      SET carrier = ?, carrier_code = ?, tracking_number = ?,
          status = 'shipped', shipped_at = ?, updated_at = ?
      WHERE id = ? AND seller_id = ?
    `).bind(
      carrier, carrierCode, trackingNumber,
      new Date().toISOString(), new Date().toISOString(),
      orderId, user.id
    ).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: { message: '提交失败' } }, 500);
  }
});

// 获取物流轨迹
logisticsRoutes.get('/track/:trackingNumber', async (c) => {
  const { trackingNumber } = c.req.param();

  // 返回模拟轨迹数据
  return c.json({
    trackingNumber,
    carrier: '快递公司',
    status: '运输中',
    traces: [
      { time: new Date().toISOString(), desc: '快件已发出' },
      { time: new Date(Date.now() - 86400000).toISOString(), desc: '快件已揽收' },
    ],
  });
});

export default logisticsRoutes;
