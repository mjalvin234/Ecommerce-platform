import { Router } from 'express';
import { qualityController } from '../controllers/quality.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();

router.use(authMiddleware);

/**
 * @route   POST /api/quality-reports
 * @desc    上传质检报告
 */
router.post('/', qualityController.uploadReport.bind(qualityController));

/**
 * @route   GET /api/quality-reports/my
 * @desc    获取我的报告列表
 */
router.get('/my', qualityController.getMyReports.bind(qualityController));

/**
 * @route   GET /api/quality-reports/order/:orderId
 * @desc    获取订单的质检报告
 */
router.get('/order/:orderId', qualityController.getByOrderId.bind(qualityController));

/**
 * @route   POST /api/quality-reports/:id/review
 * @desc    审核质检报告（管理员）
 * @access  Private (Admin)
 */
router.post('/:id/review', adminMiddleware, qualityController.reviewReport.bind(qualityController));

export default router;
