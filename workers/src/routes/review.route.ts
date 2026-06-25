import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const reviewRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

reviewRoutes.use('*', authMiddleware);

// 获取评价列表
reviewRoutes.get('/', async (c) => {
  const { userId, page = '1', pageSize = '10' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  try {
    let sql = `
      SELECT r.id, r.rating, r.content, r.reply, r.created_at,
             r.reviewer_id, r.reviewed_id,
             u.company_name as reviewer_name
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userId) {
      sql += ' AND r.reviewed_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const result = await c.env.DB.prepare(sql).bind(...params).all();

    return c.json({
      items: result.results?.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        content: r.content,
        reply: r.reply,
        createdAt: r.created_at,
        reviewer: { id: r.reviewer_id, companyName: r.reviewer_name },
      })) || [],
      total: result.results?.length || 0,
    });
  } catch (error) {
    return c.json({ items: [], total: 0 });
  }
});

// 创建评价
reviewRoutes.post('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { reviewedId, rating, content } = await c.req.json();

  if (!reviewedId || !rating) {
    return c.json({ success: false, error: { message: '缺少必填字段' } }, 400);
  }

  try {
    const id = uuidv4();
    await c.env.DB.prepare(`
      INSERT INTO reviews (id, reviewer_id, reviewed_id, rating, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, user.id, reviewedId, rating, content, new Date().toISOString()).run();

    return c.json({ id });
  } catch (error) {
    return c.json({ success: false, error: { message: '创建失败' } }, 500);
  }
});

// 回复评价
reviewRoutes.post('/:reviewId/reply', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, error: { message: '请先登录' } }, 401);

  const { reviewId } = c.req.param();
  const { content } = await c.req.json();

  try {
    await c.env.DB.prepare(`
      UPDATE reviews SET reply = ? WHERE id = ?
    `).bind(content, reviewId).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: { message: '回复失败' } }, 500);
  }
});

export default reviewRoutes;
