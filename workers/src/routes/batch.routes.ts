import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';

const batchRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 获取批量上传模板
batchRoutes.get('/template', async (c) => {
  // 返回 CSV 模板
  const template = `型号,品牌,数量,价格,年份,批次号
STM32F103C8T6,ST,100,5.50,2024,BATCH001
ESP32-WROOM-32,ESPRESSIF,50,12.00,2024,BATCH002`;

  return new Response(template, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="batch_upload_template.csv"',
    },
  });
});

// 批量上传
batchRoutes.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    const body = await c.req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({ success: false, error: { message: '请提供上传数据' } }, 400);
    }

    // 模拟处理结果
    const results = items.map((item: any, index: number) => ({
      row: index + 1,
      partNumber: item.partNumber || item['型号'] || '',
      success: true,
      message: '处理成功',
    }));

    return c.json({
      success: true,
      data: {
        total: items.length,
        success: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      },
    });
  } catch (error) {
    console.error('批量上传错误:', error);
    return c.json({ success: false, error: { message: '批量上传失败' } }, 500);
  }
});

export default batchRoutes;
