import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { apiKeyService } from '../services/apikey.service.js';
import { success } from '../utils/response.js';
import { ApiKeyPlan } from '../models/ApiKey.js';

const router = Router();

/**
 * 获取用户的API Keys
 * GET /api/api-keys
 */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const keys = await apiKeyService.getUserApiKeys(userId);

    // 隐藏secret
    const safeKeys = keys.map(k => ({
      ...k,
      secret: k.secret.substring(0, 8) + '...'
    }));

    return success(res, safeKeys);
  } catch (error) {
    next(error);
  }
});

/**
 * 申请API Key
 * POST /api/api-keys
 */
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { name, plan = 'free' } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { message: '请输入密钥名称' }
      });
    }

    const apiKey = await apiKeyService.createApiKey(userId, name, plan as ApiKeyPlan);

    return success(res, apiKey, 'API Key创建成功');
  } catch (error) {
    next(error);
  }
});

/**
 * 获取API Key详情
 * GET /api/api-keys/:id
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const apiKey = await apiKeyService.getApiKey(id, userId);
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: { message: 'API Key不存在' }
      });
    }

    return success(res, {
      ...apiKey,
      secret: apiKey.secret.substring(0, 8) + '...'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 更新API Key
 * PUT /api/api-keys/:id
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, permissions } = req.body;

    const apiKey = await apiKeyService.updateApiKey(id, userId, { name, permissions });
    return success(res, apiKey, '更新成功');
  } catch (error) {
    next(error);
  }
});

/**
 * 重新生成Secret
 * POST /api/api-keys/:id/regenerate
 */
router.post('/:id/regenerate', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const apiKey = await apiKeyService.regenerateSecret(id, userId);
    return success(res, apiKey, 'Secret已重新生成，请妥善保管');
  } catch (error) {
    next(error);
  }
});

/**
 * 暂停/恢复API Key
 * POST /api/api-keys/:id/toggle
 */
router.post('/:id/toggle', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { status } = req.body;

    const apiKey = await apiKeyService.setApiKeyStatus(id, userId, status);
    return success(res, apiKey, `API Key已${status === 'active' ? '激活' : '暂停'}`);
  } catch (error) {
    next(error);
  }
});

/**
 * 删除API Key
 * DELETE /api/api-keys/:id
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await apiKeyService.deleteApiKey(id, userId);
    return success(res, null, '删除成功');
  } catch (error) {
    next(error);
  }
});

/**
 * 升级套餐
 * POST /api/api-keys/:id/upgrade
 */
router.post('/:id/upgrade', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { plan } = req.body;

    const apiKey = await apiKeyService.upgradePlan(id, userId, plan as ApiKeyPlan);
    return success(res, apiKey, '套餐升级成功');
  } catch (error) {
    next(error);
  }
});

/**
 * 获取使用统计
 * GET /api/api-keys/:id/stats
 */
router.get('/:id/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const stats = await apiKeyService.getUsageStats(id, userId);
    return success(res, stats);
  } catch (error) {
    next(error);
  }
});

export default router;
