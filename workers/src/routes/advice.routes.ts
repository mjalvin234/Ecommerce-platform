import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';

const adviceRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 芯片使用建议
adviceRoutes.get('/usage/dummy', async (c) => {
  try {
    const brand = c.req.query('brand') || '';
    const model = c.req.query('model') || '';
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());
    const quantity = parseInt(c.req.query('quantity') || '1');

    const chipAge = new Date().getFullYear() - year;
    let overallStatus: 'excellent' | 'good' | 'fair' | 'caution';

    if (chipAge <= 2) {
      overallStatus = 'excellent';
    } else if (chipAge <= 5) {
      overallStatus = 'good';
    } else if (chipAge <= 10) {
      overallStatus = 'fair';
    } else {
      overallStatus = 'caution';
    }

    const advice = [
      {
        category: 'storage',
        title: '存储条件建议',
        content: '温度: -40°C ~ 85°C，湿度: < 60%。建议使用干燥剂存储，避免阳光直射。',
        priority: 'high',
      },
      {
        category: 'usage',
        title: '使用建议',
        content: chipAge > 5
          ? '建议使用前进行抽样测试，焊接前检查引脚状态。'
          : '芯片状态良好，可正常使用。建议遵循标准焊接工艺。',
        priority: chipAge > 5 ? 'medium' : 'low',
      },
    ];

    if (chipAge > 5) {
      advice.push({
        category: 'warning',
        title: '芯片年限提醒',
        content: `此批次芯片已生产 ${chipAge} 年。建议进行老化测试后再投入使用。`,
        priority: chipAge > 10 ? 'high' : 'medium',
      });
    }

    const recommendations = [
      chipAge <= 3 ? '芯片状态优秀，可放心使用' :
      chipAge <= 7 ? '芯片状态良好，建议按规范使用' :
      '建议谨慎使用，优先用于非关键场景',
      '建议遵循标准焊接工艺',
    ];

    if (chipAge > 5) {
      recommendations.push('建议进行100%功能测试');
    }

    return c.json({
      overallStatus,
      advice,
      recommendations,
    });
  } catch (error) {
    console.error('获取使用建议错误:', error);
    return c.json({ success: false, error: { message: '获取使用建议失败' } }, 500);
  }
});

// 交期预估
adviceRoutes.post('/delivery-estimate', async (c) => {
  try {
    const body = await c.req.json();
    const { buyerAddress, carrier } = body;

    // 简单模拟计算
    const baseDays = 2; // 卖家发货到 QA
    const qaDays = 2; // QA 质检
    const deliveryDays = 3; // QA 到买家

    const now = new Date();
    const sellerToQADate = new Date(now.getTime() + baseDays * 24 * 60 * 60 * 1000);
    const qaInspectionDate = new Date(now.getTime() + (baseDays + qaDays) * 24 * 60 * 60 * 1000);
    const estimatedDate = new Date(now.getTime() + (baseDays + qaDays + deliveryDays) * 24 * 60 * 60 * 1000);

    return c.json({
      totalDays: baseDays + qaDays + deliveryDays,
      estimatedDate: estimatedDate.toISOString(),
      stages: {
        sellerToQA: {
          days: baseDays,
          date: sellerToQADate.toISOString(),
        },
        qaInspection: {
          days: qaDays,
          date: qaInspectionDate.toISOString(),
        },
        qaToBuyer: {
          days: deliveryDays,
          date: estimatedDate.toISOString(),
        },
      },
      notes: ['芯片状态良好，质检时间为标准时长'],
    });
  } catch (error) {
    console.error('交期预估错误:', error);
    return c.json({ success: false, error: { message: '交期预估失败' } }, 500);
  }
});

export default adviceRoutes;
