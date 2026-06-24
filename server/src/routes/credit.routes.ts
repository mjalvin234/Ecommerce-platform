import { Router } from 'express';
import { creditController } from '../controllers/credit.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();

// 所有信用路由需要登录
router.use(authMiddleware);

/**
 * @route   GET /api/credit/info
 * @desc    获取当前用户信用信息
 */
router.get('/info', creditController.getMyCreditInfo.bind(creditController));

/**
 * @route   GET /api/credit/history
 * @desc    获取信用分历史
 */
router.get('/history', creditController.getCreditHistory.bind(creditController));

/**
 * @route   GET /api/credit/user/:userId
 * @desc    获取用户信用信息（公开）
 */
router.get('/user/:userId', creditController.getUserCredit.bind(creditController));

/**
 * @route   POST /api/credit/adjust
 * @desc    管理员调整信用分
 */
router.post('/adjust', adminMiddleware, creditController.adminAdjust.bind(creditController));

export default router;
