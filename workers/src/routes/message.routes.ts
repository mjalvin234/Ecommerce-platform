import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { v4 as uuidv4 } from 'uuid';

const messageRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 中间件：验证登录
messageRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: { message: '请先登录' } }, 401);
  }
  await next();
});

// 获取消息列表
messageRoutes.get('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

    const { type, category, page = '1', pageSize = '20' } = c.req.query();
    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    let sql = 'SELECT * FROM messages WHERE user_id = ? AND deleted_at IS NULL';
    const params: any[] = [user.id];

    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (category) { sql += ' AND category = ?'; params.push(category); }

    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const countResult = await c.env.DB.prepare(countSql).bind(...params).first();
    const total = countResult?.total || 0;

    // 获取未读统计
    const unreadResult = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN category = 'order' THEN 1 ELSE 0 END) as order_unread,
        SUM(CASE WHEN category = 'negotiation' THEN 1 ELSE 0 END) as negotiation_unread,
        SUM(CASE WHEN category = 'system' THEN 1 ELSE 0 END) as system_unread
      FROM messages
      WHERE user_id = ? AND read = 0 AND deleted_at IS NULL
    `).bind(user.id).first() as any;

    // 分页查询
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize as string), offset);

    const result = await c.env.DB.prepare(sql).bind(...params).all();

    return c.json({
      success: true,
      data: {
        items: result.results?.map((m: any) => ({
          id: m.id,
          type: m.type,
          title: m.title,
          content: m.content,
          relatedData: m.related_data ? JSON.parse(m.related_data) : undefined,
          read: m.read === 1,
          createdAt: m.created_at,
        })) || [],
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        totalPages: Math.ceil(Number(total) / parseInt(pageSize as string)),
        unreadCount: {
          total: unreadResult?.total || 0,
          byCategory: {
            order: unreadResult?.order_unread || 0,
            negotiation: unreadResult?.negotiation_unread || 0,
            system: unreadResult?.system_unread || 0,
          },
        },
      },
    });
  } catch (error) {
    console.error('获取消息列表错误:', error);
    return c.json({ success: false, error: { message: '获取消息列表失败' } }, 500);
  }
});

// 获取未读数量
messageRoutes.get('/unread-count', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

    const result = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN category = 'order' THEN 1 ELSE 0 END) as order_unread,
        SUM(CASE WHEN category = 'negotiation' THEN 1 ELSE 0 END) as negotiation_unread,
        SUM(CASE WHEN category = 'system' THEN 1 ELSE 0 END) as system_unread
      FROM messages
      WHERE user_id = ? AND read = 0 AND deleted_at IS NULL
    `).bind(user.id).first() as any;

    return c.json({
      success: true,
      data: {
        total: result?.total || 0,
        byCategory: {
          order: result?.order_unread || 0,
          negotiation: result?.negotiation_unread || 0,
          system: result?.system_unread || 0,
        },
      },
    });
  } catch (error) {
    console.error('获取未读数量错误:', error);
    return c.json({ success: false, error: { message: '获取未读数量失败' } }, 500);
  }
});

// 标记消息已读
messageRoutes.patch('/:id/read', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

    const { id } = c.req.param();

    await c.env.DB.prepare(
      'UPDATE messages SET read = 1, updated_at = ? WHERE id = ? AND user_id = ?'
    ).bind(new Date().toISOString(), id, user.id).run();

    return c.json({ success: true, data: { read: true } });
  } catch (error) {
    console.error('标记消息已读错误:', error);
    return c.json({ success: false, error: { message: '标记消息已读失败' } }, 500);
  }
});

// 标记所有消息已读
messageRoutes.patch('/read-all', async (c) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

    const { type, category } = c.req.query();

    let sql = 'UPDATE messages SET read = 1, updated_at = ? WHERE user_id = ? AND read = 0';
    const params: any[] = [new Date().toISOString(), user.id];

    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (category) { sql += ' AND category = ?'; params.push(category); }

    const result = await c.env.DB.prepare(sql).bind(...params).run();

    return c.json({
      success: true,
      data: { success: true, updatedCount: result.meta?.changes || 0 },
    });
  } catch (error) {
    console.error('标记所有消息已读错误:', error);
    return c.json({ success: false, error: { message: '标记所有消息已读失败' } }, 500);
  }
});

// 发送消息（内部使用）
export async function sendMessage(
  db: D1Database,
  userId: string,
  type: string,
  category: string,
  title: string,
  content: string,
  relatedData?: any
) {
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO messages (id, user_id, type, category, title, content, related_data, read, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).bind(id, userId, type, category, title, content, relatedData ? JSON.stringify(relatedData) : null, now, now).run();

  return id;
}

export default messageRoutes;
