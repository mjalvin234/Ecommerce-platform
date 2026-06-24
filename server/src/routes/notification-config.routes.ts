import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';
import { notificationConfigService } from '../services/notification-config.service.js';

const router = Router();

// 所有路由都需要认证和管理员权限
router.use(authMiddleware, adminMiddleware);

// ============ 通知节点配置 ============

/**
 * 获取通知节点列表
 * GET /api/notification-config/nodes
 */
router.get('/nodes', async (_req: Request, res: Response) => {
  try {
    const nodes = await notificationConfigService.getNotificationNodes();
    res.json({ success: true, data: nodes });
  } catch (error) {
    console.error('获取通知节点失败:', error);
    res.status(500).json({ success: false, message: '获取通知节点失败' });
  }
});

/**
 * 更新通知节点配置
 * PUT /api/notification-config/nodes/:code
 */
router.put('/nodes/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { adminMessageEnabled, adminEmailEnabled, userNotificationEnabled } = req.body;

    const node = await notificationConfigService.updateNotificationNode(code, {
      adminMessageEnabled,
      adminEmailEnabled,
      userNotificationEnabled,
    });

    if (!node) {
      return res.status(404).json({ success: false, message: '通知节点不存在' });
    }

    res.json({ success: true, data: node });
  } catch (error) {
    console.error('更新通知节点失败:', error);
    res.status(500).json({ success: false, message: '更新通知节点失败' });
  }
});

// ============ 管理员邮箱管理 ============

/**
 * 获取管理员邮箱列表
 * GET /api/notification-config/admin-emails
 */
router.get('/admin-emails', async (_req: Request, res: Response) => {
  try {
    const emails = await notificationConfigService.getAdminEmails();
    res.json({ success: true, data: emails });
  } catch (error) {
    console.error('获取管理员邮箱失败:', error);
    res.status(500).json({ success: false, message: '获取管理员邮箱失败' });
  }
});

/**
 * 添加管理员邮箱
 * POST /api/notification-config/admin-emails
 */
router.post('/admin-emails', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: '请提供邮箱地址' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: '邮箱格式不正确' });
    }

    const adminEmail = await notificationConfigService.addAdminEmail(email, name);
    res.json({ success: true, data: adminEmail });
  } catch (error: any) {
    console.error('添加管理员邮箱失败:', error);
    if (error.message === '该邮箱已存在') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: '添加管理员邮箱失败' });
  }
});

/**
 * 更新管理员邮箱
 * PUT /api/notification-config/admin-emails/:id
 */
router.put('/admin-emails/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, active, verified } = req.body;

    const email = await notificationConfigService.updateAdminEmail(id, {
      name,
      active,
      verified,
    });

    if (!email) {
      return res.status(404).json({ success: false, message: '邮箱不存在' });
    }

    res.json({ success: true, data: email });
  } catch (error) {
    console.error('更新管理员邮箱失败:', error);
    res.status(500).json({ success: false, message: '更新管理员邮箱失败' });
  }
});

/**
 * 设为主邮箱
 * PUT /api/notification-config/admin-emails/:id/primary
 */
router.put('/admin-emails/:id/primary', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const success = await notificationConfigService.setPrimaryEmail(id);

    if (!success) {
      return res.status(404).json({ success: false, message: '邮箱不存在或未激活' });
    }

    res.json({ success: true, message: '已设为主邮箱' });
  } catch (error) {
    console.error('设置主邮箱失败:', error);
    res.status(500).json({ success: false, message: '设置主邮箱失败' });
  }
});

/**
 * 删除管理员邮箱
 * DELETE /api/notification-config/admin-emails/:id
 */
router.delete('/admin-emails/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const success = await notificationConfigService.deleteAdminEmail(id);

    if (!success) {
      return res.status(404).json({ success: false, message: '邮箱不存在' });
    }

    res.json({ success: true, message: '邮箱已删除' });
  } catch (error) {
    console.error('删除管理员邮箱失败:', error);
    res.status(500).json({ success: false, message: '删除管理员邮箱失败' });
  }
});

// ============ 邮件模版管理 ============

/**
 * 获取邮件模版列表
 * GET /api/notification-config/templates
 */
router.get('/templates', async (_req: Request, res: Response) => {
  try {
    const templates = await notificationConfigService.getEmailTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('获取邮件模版失败:', error);
    res.status(500).json({ success: false, message: '获取邮件模版失败' });
  }
});

/**
 * 获取单个邮件模版
 * GET /api/notification-config/templates/:code
 */
router.get('/templates/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const template = await notificationConfigService.getEmailTemplate(code);

    if (!template) {
      return res.status(404).json({ success: false, message: '模版不存在' });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('获取邮件模版失败:', error);
    res.status(500).json({ success: false, message: '获取邮件模版失败' });
  }
});

/**
 * 更新邮件模版
 * PUT /api/notification-config/templates/:code
 */
router.put('/templates/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { subject, body, adminSubject, adminBody } = req.body;

    const template = await notificationConfigService.updateEmailTemplate(code, {
      subject,
      body,
      adminSubject,
      adminBody,
    });

    if (!template) {
      return res.status(404).json({ success: false, message: '模版不存在' });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('更新邮件模版失败:', error);
    res.status(500).json({ success: false, message: '更新邮件模版失败' });
  }
});

/**
 * 初始化默认数据
 * POST /api/notification-config/initialize
 */
router.post('/initialize', async (_req: Request, res: Response) => {
  try {
    await notificationConfigService.initializeDefaults();
    res.json({ success: true, message: '初始化完成' });
  } catch (error) {
    console.error('初始化默认数据失败:', error);
    res.status(500).json({ success: false, message: '初始化失败' });
  }
});

export default router;
