import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const notificationRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

notificationRoutes.use('*', authMiddleware);

// 获取管理员邮箱列表
notificationRoutes.get('/admin-emails', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT id, email, name, is_primary, active, verified, created_at
      FROM admin_emails
      ORDER BY is_primary DESC, created_at ASC
    `).all();

    return c.json(result.results?.map((item: any) => ({
      id: item.id,
      email: item.email,
      name: item.name,
      isPrimary: item.is_primary === 1,
      active: item.active === 1,
      verified: item.verified === 1,
      createdAt: item.created_at,
    })) || []);
  } catch (error) {
    console.error('获取管理员邮箱列表错误:', error);
    // 表不存在时返回空数组
    return c.json([]);
  }
});

// 添加管理员邮箱
notificationRoutes.post('/admin-emails', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      return c.json({ success: false, error: { message: '需要管理员权限' } }, 403);
    }

    const { email, name } = await c.req.json();
    if (!email) {
      return c.json({ success: false, error: { message: '邮箱不能为空' } }, 400);
    }

    const id = uuidv4();
    await c.env.DB.prepare(`
      INSERT INTO admin_emails (id, email, name, is_primary, active, verified, created_at)
      VALUES (?, ?, ?, 0, 1, 0, ?)
    `).bind(id, email, name || '', new Date().toISOString()).run();

    return c.json({
      id,
      email,
      name: name || '',
      isPrimary: false,
      active: true,
      verified: false,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('添加管理员邮箱错误:', error);
    return c.json({ success: false, error: { message: '添加失败' } }, 500);
  }
});

// 更新管理员邮箱
notificationRoutes.put('/admin-emails/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      return c.json({ success: false, error: { message: '需要管理员权限' } }, 403);
    }

    const { id } = c.req.param();
    const { name, active, verified } = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE admin_emails
      SET name = COALESCE(?, name),
          active = COALESCE(?, active),
          verified = COALESCE(?, verified)
      WHERE id = ?
    `).bind(name, active === undefined ? null : active ? 1 : 0, verified === undefined ? null : verified ? 1 : 0, id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('更新管理员邮箱错误:', error);
    return c.json({ success: false, error: { message: '更新失败' } }, 500);
  }
});

// 设为主邮箱
notificationRoutes.put('/admin-emails/:id/primary', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      return c.json({ success: false, error: { message: '需要管理员权限' } }, 403);
    }

    const { id } = c.req.param();

    // 先清除所有主邮箱
    await c.env.DB.prepare('UPDATE admin_emails SET is_primary = 0').run();
    // 设置新的主邮箱
    await c.env.DB.prepare('UPDATE admin_emails SET is_primary = 1 WHERE id = ?').bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('设置主邮箱错误:', error);
    return c.json({ success: false, error: { message: '设置失败' } }, 500);
  }
});

// 删除管理员邮箱
notificationRoutes.delete('/admin-emails/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      return c.json({ success: false, error: { message: '需要管理员权限' } }, 403);
    }

    const { id } = c.req.param();
    await c.env.DB.prepare('DELETE FROM admin_emails WHERE id = ?').bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('删除管理员邮箱错误:', error);
    return c.json({ success: false, error: { message: '删除失败' } }, 500);
  }
});

// 获取邮件模版列表
notificationRoutes.get('/templates', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT code, name, subject, body, admin_subject, admin_body, updated_at
      FROM email_templates
      ORDER BY code
    `).all();

    return c.json(result.results?.map((item: any) => ({
      code: item.code,
      name: item.name,
      subject: item.subject,
      body: item.body,
      adminSubject: item.admin_subject,
      adminBody: item.admin_body,
      updatedAt: item.updated_at,
    })) || []);
  } catch (error) {
    console.error('获取邮件模版列表错误:', error);
    return c.json([]);
  }
});

// 获取单个邮件模版
notificationRoutes.get('/templates/:code', async (c) => {
  try {
    const { code } = c.req.param();
    const result = await c.env.DB.prepare(`
      SELECT code, name, subject, body, admin_subject, admin_body, updated_at
      FROM email_templates
      WHERE code = ?
    `).bind(code).first();

    if (!result) {
      return c.json({ success: false, error: { message: '模版不存在' } }, 404);
    }

    return c.json({
      code: result.code,
      name: result.name,
      subject: result.subject,
      body: result.body,
      adminSubject: result.admin_subject,
      adminBody: result.admin_body,
      updatedAt: result.updated_at,
    });
  } catch (error) {
    console.error('获取邮件模版错误:', error);
    return c.json({ success: false, error: { message: '获取失败' } }, 500);
  }
});

// 更新邮件模版
notificationRoutes.put('/templates/:code', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      return c.json({ success: false, error: { message: '需要管理员权限' } }, 403);
    }

    const { code } = c.req.param();
    const { subject, body, adminSubject, adminBody } = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE email_templates
      SET subject = COALESCE(?, subject),
          body = COALESCE(?, body),
          admin_subject = COALESCE(?, admin_subject),
          admin_body = COALESCE(?, admin_body),
          updated_at = ?
      WHERE code = ?
    `).bind(subject, body, adminSubject, adminBody, new Date().toISOString(), code).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('更新邮件模版错误:', error);
    return c.json({ success: false, error: { message: '更新失败' } }, 500);
  }
});

// 初始化通知配置默认数据
notificationRoutes.post('/initialize', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      return c.json({ success: false, error: { message: '需要管理员权限' } }, 403);
    }

    // 初始化默认邮件模版
    const defaultTemplates = [
      { code: 'order_created', name: '订单创建通知', subject: '新订单创建', body: '您有新的订单已创建' },
      { code: 'order_paid', name: '订单支付通知', subject: '订单已支付', body: '订单已支付成功' },
      { code: 'order_shipped', name: '订单发货通知', subject: '订单已发货', body: '您的订单已发货' },
      { code: 'order_completed', name: '订单完成通知', subject: '订单已完成', body: '订单已完成' },
      { code: 'negotiation_created', name: '议价创建通知', subject: '新的议价请求', body: '您有新的议价请求' },
      { code: 'negotiation_responded', name: '议价回复通知', subject: '议价已回复', body: '您的议价已得到回复' },
    ];

    for (const template of defaultTemplates) {
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO email_templates (code, name, subject, body, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(template.code, template.name, template.subject, template.body, new Date().toISOString()).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('初始化通知配置错误:', error);
    return c.json({ success: false, error: { message: '初始化失败' } }, 500);
  }
});

// 获取通知节点配置
notificationRoutes.get('/nodes', async (c) => {
  try {
    // 返回预设的通知节点配置
    const nodes = [
      { id: 'order_created', name: '订单创建', enabled: true, channels: ['email', 'sms'] },
      { id: 'order_paid', name: '订单支付', enabled: true, channels: ['email'] },
      { id: 'order_shipped', name: '订单发货', enabled: true, channels: ['email', 'sms'] },
      { id: 'order_completed', name: '订单完成', enabled: true, channels: ['email'] },
      { id: 'negotiation_created', name: '议价创建', enabled: true, channels: ['email'] },
      { id: 'negotiation_responded', name: '议价回复', enabled: true, channels: ['email'] },
      { id: 'inventory_low', name: '库存不足', enabled: false, channels: ['email'] },
      { id: 'payment_received', name: '收款到账', enabled: true, channels: ['email', 'sms'] },
    ];

    return c.json(nodes);
  } catch (error) {
    console.error('获取通知节点错误:', error);
    return c.json([]);
  }
});

export default notificationRoutes;
