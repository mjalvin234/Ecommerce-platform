import { Router } from 'express';
import { settlementController } from '../controllers/settlement.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();

/**
 * @route   GET /api/settlements
 * @desc    获取卖家结算记录
 * @access  Private (Seller)
 */
router.get('/', authMiddleware, settlementController.getMySettlements.bind(settlementController));

/**
 * @route   GET /api/settlements/stats
 * @desc    获取卖家结算统计
 * @access  Private (Seller)
 */
router.get('/stats', authMiddleware, settlementController.getSettlementStats.bind(settlementController));

/**
 * @route   GET /api/settlements/pending
 * @desc    获取待处理结算列表（管理员）
 * @access  Private (Admin)
 */
router.get('/pending', authMiddleware, adminMiddleware, settlementController.getPendingSettlements.bind(settlementController));

/**
 * @route   GET /api/settlements/:id
 * @desc    获取结算详情
 * @access  Private (Seller/Admin)
 */
router.get('/:id', authMiddleware, settlementController.getSettlementById.bind(settlementController));

/**
 * @route   POST /api/settlements/:id/process
 * @desc    处理结算（管理员）
 * @access  Private (Admin)
 */
router.post('/:id/process', authMiddleware, adminMiddleware, settlementController.processSettlement.bind(settlementController));

/**
 * @route   POST /api/settlements/:id/retry
 * @desc    重试失败的结算
 * @access  Private (Admin)
 */
router.post('/:id/retry', authMiddleware, adminMiddleware, settlementController.retrySettlement.bind(settlementController));

/**
 * @route   PUT /api/settlements/account
 * @desc    更新卖家收款账号设置
 * @access  Private (Seller)
 */
router.put('/account', authMiddleware, settlementController.updateSettlementAccount.bind(settlementController));

export default router;
