import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { webhookService } from '../services/webhook.service.js';
import { success } from '../utils/response.js';
import { WebhookEvent } from '../models/Webhook.js';

const router = Router();

/**
 * 获取用户的Webhooks
 * GET /api/webhooks
 */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const webhooks = await webhookService.getUserWebhooks(userId);

    // 隐藏secret
    const safeWebhooks = webhooks.map(w => ({
      ...w,
      secret: w.secret.substring(0, 8) + '...'
    }));

    return success(res, safeWebhooks);
  } catch (error) {
    next(error);
  }
});

/**
 * 创建Webhook
 * POST /api/webhooks
 */
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { url, events } = req.body;

    if (!url || !events || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: '请提供URL和订阅事件' }
      });
    }

    const webhook = await webhookService.createWebhook(userId, url, events as WebhookEvent[]);
    return success(res, webhook, 'Webhook创建成功');
  } catch (error) {
    next(error);
  }
});

/**
 * 获取Webhook详情
 * GET /api/webhooks/:id
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const webhook = await webhookService.getWebhook(id, userId);
    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: { message: 'Webhook不存在' }
      });
    }

    return success(res, {
      ...webhook,
      secret: webhook.secret.substring(0, 8) + '...'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 更新Webhook
 * PUT /api/webhooks/:id
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { url, events, active } = req.body;

    const webhook = await webhookService.updateWebhook(id, userId, { url, events, active });
    return success(res, webhook, '更新成功');
  } catch (error) {
    next(error);
  }
});

/**
 * 删除Webhook
 * DELETE /api/webhooks/:id
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await webhookService.deleteWebhook(id, userId);
    return success(res, null, '删除成功');
  } catch (error) {
    next(error);
  }
});

/**
 * 重新生成Secret
 * POST /api/webhooks/:id/regenerate
 */
router.post('/:id/regenerate', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const webhook = await webhookService.regenerateSecret(id, userId);
    return success(res, webhook, 'Secret已重新生成');
  } catch (error) {
    next(error);
  }
});

/**
 * 测试Webhook
 * POST /api/webhooks/:id/test
 */
router.post('/:id/test', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await webhookService.testWebhook(id, userId);
    return success(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * 获取Webhook日志
 * GET /api/webhooks/:id/logs
 */
router.get('/:id/logs', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { page = '1', pageSize = '20' } = req.query;

    const [logs, total] = await webhookService.getWebhookLogs(id, userId, {
      limit: parseInt(pageSize as string, 10),
      offset: (parseInt(page as string, 10) - 1) * parseInt(pageSize as string, 10)
    });

    return success(res, { items: logs, total });
  } catch (error) {
    next(error);
  }
});

export default router;
