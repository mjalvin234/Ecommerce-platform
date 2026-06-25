import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middlewares/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const invoiceRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

invoiceRoutes.use('*', authMiddleware);

// 获取发票信息
invoiceRoutes.get('/info', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    const invoice = await c.env.DB.prepare(
      'SELECT * FROM invoice_info WHERE user_id = ?'
    ).bind(user.id).first();

    if (!invoice) {
      return c.json({
        success: true,
        data: null,
      });
    }

    return c.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('获取发票信息错误:', error);
    return c.json({ success: false, error: { message: '获取发票信息失败' } }, 500);
  }
});

// 保存发票信息
invoiceRoutes.post('/info', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: { message: '请先登录' } }, 401);
    }

    const {
      invoiceType,
      companyName,
      taxNumber,
      bankName,
      bankAccount,
      address,
      phone,
      contactPerson,
      contactPhone,
    } = await c.req.json();

    if (!companyName || !taxNumber) {
      return c.json({ success: false, error: { message: '请填写完整信息' } }, 400);
    }

    const existing = await c.env.DB.prepare(
      'SELECT id FROM invoice_info WHERE user_id = ?'
    ).bind(user.id).first();

    const now = new Date().toISOString();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE invoice_info
        SET invoice_type = ?, company_name = ?, tax_number = ?, bank_name = ?, bank_account = ?,
            address = ?, phone = ?, contact_person = ?, contact_phone = ?, updated_at = ?
        WHERE user_id = ?
      `).bind(
        invoiceType, companyName, taxNumber, bankName, bankAccount,
        address, phone, contactPerson, contactPhone, now, user.id
      ).run();
    } else {
      const id = uuidv4();
      await c.env.DB.prepare(`
        INSERT INTO invoice_info (id, user_id, invoice_type, company_name, tax_number, bank_name, bank_account, address, phone, contact_person, contact_phone, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, user.id, invoiceType, companyName, taxNumber, bankName, bankAccount,
        address, phone, contactPerson, contactPhone, now, now
      ).run();
    }

    return c.json({ success: true, message: '保存成功' });
  } catch (error) {
    console.error('保存发票信息错误:', error);
    return c.json({ success: false, error: { message: '保存发票信息失败' } }, 500);
  }
});

export default invoiceRoutes;
