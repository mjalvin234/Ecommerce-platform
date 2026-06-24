import { Router, Request, Response, NextFunction } from 'express';
import { corporatePaymentService } from '../services/corporate-payment.service.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';
import { success } from '../utils/response.js';

const router = Router();

// 所有路由需要认证
router.use(authMiddleware);

/**
 * 创建对公支付申请
 * POST /api/corporate-payments
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, amount, bankName, bankAccount, proofUrl } = req.body;

    if (!orderId || !amount || !bankName || !bankAccount || !proofUrl) {
      return res.status(400).json({
        success: false,
        error: { message: '缺少必要参数' },
      });
    }

    const payment = await corporatePaymentService.createPayment(
      req.user!.id,
      orderId,
      { amount, bankName, bankAccount, proofUrl }
    );

    return success(res, {
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      status: payment.status,
      createdAt: payment.createdAt,
    }, '对公支付申请已提交，请等待审核');
  } catch (error) {
    next(error);
  }
});

/**
 * 获取用户对公支付记录
 * GET /api/corporate-payments
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payments = await corporatePaymentService.getUserPayments(req.user!.id);
    return success(res, payments.map(p => ({
      id: p.id,
      orderId: p.orderId,
      amount: p.amount,
      bankName: p.bankName,
      status: p.status,
      rejectReason: p.rejectReason,
      createdAt: p.createdAt,
      confirmedAt: p.confirmedAt,
    })));
  } catch (error) {
    next(error);
  }
});

/**
 * 获取待审核的对公支付（管理员）
 * GET /api/corporate-payments/pending
 */
router.get('/pending', adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await corporatePaymentService.getPendingPayments(page, pageSize);

    return success(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * 获取所有对公支付记录（管理员）
 * GET /api/corporate-payments/all
 */
router.get('/all', adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as any;

    const result = await corporatePaymentService.getAllPayments(page, pageSize, status);
    return success(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * 获取统计信息（管理员）
 * GET /api/corporate-payments/stats
 */
router.get('/stats', adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await corporatePaymentService.getStats();
    return success(res, stats);
  } catch (error) {
    next(error);
  }
});

/**
 * 确认对公支付（管理员）
 * POST /api/corporate-payments/:id/confirm
 */
router.post('/:id/confirm', adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await corporatePaymentService.confirmPayment(
      req.params.id,
      req.user!.id
    );

    return success(res, {
      id: payment.id,
      status: payment.status,
      confirmedAt: payment.confirmedAt,
    }, '对公支付已确认');
  } catch (error) {
    next(error);
  }
});

/**
 * 拒绝对公支付（管理员）
 * POST /api/corporate-payments/:id/reject
 */
router.post('/:id/reject', adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: { message: '请填写拒绝原因' },
      });
    }

    const payment = await corporatePaymentService.rejectPayment(
      req.params.id,
      req.user!.id,
      reason
    );

    return success(res, {
      id: payment.id,
      status: payment.status,
      rejectReason: payment.rejectReason,
    }, '已拒绝该支付申请');
  } catch (error) {
    next(error);
  }
});

/**
 * 获取支付详情
 * GET /api/corporate-payments/:id
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await corporatePaymentService.getPaymentById(
      req.params.id,
      req.user!.id
    );
    return success(res, payment);
  } catch (error) {
    next(error);
  }
});

export default router;
