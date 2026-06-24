import { Router, Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service.js';
import { qualityService } from '../services/quality.service.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { success } from '../utils/response.js';

const router = Router();

// 所有路由需要认证
router.use(authMiddleware);

/**
 * 获取待质检订单列表
 * GET /api/qa/pending
 */
router.get('/pending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    // 检查权限：管理员或QA质检员
    if (user.role !== 'admin' && user.role !== 'qa') {
      return res.status(403).json({
        success: false,
        error: { message: '无权访问' },
      });
    }

    const { page = '1', pageSize = '20', status } = req.query;

    // 调用订单服务获取QA状态的订单
    const result = await orderService.getQaOrders(
      parseInt(page as string, 10),
      parseInt(pageSize as string, 10),
      status as string
    );

    return success(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * QA收货确认
 * POST /api/qa/orders/:id/receive
 */
router.post('/orders/:id/receive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    if (user.role !== 'admin' && user.role !== 'qa') {
      return res.status(403).json({
        success: false,
        error: { message: '无权操作' },
      });
    }

    const result = await orderService.qaReceive(user.id, req.params.id);
    return success(res, result, '已确认收货');
  } catch (error) {
    next(error);
  }
});

/**
 * QA质检通过
 * POST /api/qa/orders/:id/pass
 */
router.post('/orders/:id/pass', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    if (user.role !== 'admin' && user.role !== 'qa') {
      return res.status(403).json({
        success: false,
        error: { message: '无权操作' },
      });
    }

    const result = await orderService.qaPass(user.id, req.params.id);
    return success(res, result, '质检通过');
  } catch (error) {
    next(error);
  }
});

/**
 * 质检通过，发货给买家
 * POST /api/qa/orders/:id/ship
 */
router.post('/orders/:id/ship', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    if (user.role !== 'admin' && user.role !== 'qa') {
      return res.status(403).json({
        success: false,
        error: { message: '无权操作' },
      });
    }

    const { carrier, trackingNumber } = req.body;

    if (!carrier || !trackingNumber) {
      return res.status(400).json({
        success: false,
        error: { message: '请填写物流信息' },
      });
    }

    const result = await orderService.qaShipToBuyer(user.id, req.params.id, {
      carrier,
      trackingNumber,
    });
    return success(res, result, '已发货给买家');
  } catch (error) {
    next(error);
  }
});

/**
 * 质检失败，退回卖家
 * POST /api/qa/orders/:id/reject
 */
router.post('/orders/:id/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    if (user.role !== 'admin' && user.role !== 'qa') {
      return res.status(403).json({
        success: false,
        error: { message: '无权操作' },
      });
    }

    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: { message: '请填写失败原因' },
      });
    }

    const result = await orderService.qaReject(user.id, req.params.id, reason);
    return success(res, result, '质检失败，已退回卖家');
  } catch (error) {
    next(error);
  }
});

/**
 * 上传质检报告
 * POST /api/qa/reports
 */
router.post('/reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    if (user.role !== 'admin' && user.role !== 'qa') {
      return res.status(403).json({
        success: false,
        error: { message: '无权操作' },
      });
    }

    const { orderId, reportFile, photos, videoUrl, conclusion, testItems } = req.body;

    if (!orderId || !reportFile || !conclusion) {
      return res.status(400).json({
        success: false,
        error: { message: '缺少必要参数' },
      });
    }

    const result = await qualityService.uploadReport(user.id, orderId, {
      reportFile,
      photos,
      videoUrl,
      conclusion,
      testItems,
    });

    return success(res, result, '质检报告上传成功', 201);
  } catch (error) {
    next(error);
  }
});

/**
 * 获取质检报告
 * GET /api/qa/reports/:orderId
 */
router.get('/reports/:orderId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const result = await qualityService.getByOrderId(req.params.orderId, user.id);
    return success(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * QA统计信息
 * GET /api/qa/stats
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    if (user.role !== 'admin' && user.role !== 'qa') {
      return res.status(403).json({
        success: false,
        error: { message: '无权访问' },
      });
    }

    const stats = await orderService.getQaStats();
    return success(res, stats);
  } catch (error) {
    next(error);
  }
});

export default router;
