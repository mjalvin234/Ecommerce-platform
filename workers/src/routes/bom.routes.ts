import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const bomRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 获取 BOM 模板列表
bomRoutes.get('/templates', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    // 返回模板列表
    return c.json({
      success: true,
      data: [
        {
          id: 'tpl_001',
          name: '标准 BOM 模板',
          description: '适用于大多数电子元器件采购',
          columns: ['型号', '品牌', '数量', '目标价格', '交期要求'],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tpl_002',
          name: '汽车电子 BOM 模板',
          description: '适用于汽车电子元器件采购，包含车规认证信息',
          columns: ['型号', '品牌', '数量', '目标价格', '车规等级', '交期要求'],
          createdAt: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    console.error('获取 BOM 模板错误:', error);
    return c.json({ success: false, error: { message: '获取模板失败' } }, 500);
  }
});

// 创建 BOM 任务
bomRoutes.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    const body = await c.req.json();
    const { name, items, templateId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({ success: false, error: { message: '请提供 BOM 数据' } }, 400);
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    // 返回任务信息
    return c.json({
      success: true,
      data: {
        id,
        name: name || '未命名 BOM',
        totalItems: items.length,
        status: 'pending',
        createdAt: now,
      },
    });
  } catch (error) {
    console.error('创建 BOM 任务错误:', error);
    return c.json({ success: false, error: { message: '创建任务失败' } }, 500);
  }
});

// 获取 BOM 任务列表
bomRoutes.get('/tasks', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    return c.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error('获取 BOM 任务列表错误:', error);
    return c.json({ success: false, error: { message: '获取任务列表失败' } }, 500);
  }
});

// 下载 BOM 任务结果
bomRoutes.get('/tasks/:id/download', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    const { id } = c.req.param();

    // 返回示例 CSV
    const csv = `型号,品牌,需求数量,匹配数量,匹配价格,供应商,状态
STM32F103C8T6,ST,100,100,5.50,供应商A,已匹配
ESP32-WROOM-32,ESPRESSIF,50,30,12.00,供应商B,部分匹配`;

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="bom_${id}_result.csv"`,
      },
    });
  } catch (error) {
    console.error('下载 BOM 结果错误:', error);
    return c.json({ success: false, error: { message: '下载失败' } }, 500);
  }
});

export default bomRoutes;
