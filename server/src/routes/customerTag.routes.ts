import { Router } from 'express';
import { customerTagController } from '../controllers/customerTag.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/customer-tags
 * @desc    标记客户
 * @access  Private
 */
router.post('/', authMiddleware, customerTagController.tagCustomer.bind(customerTagController));

/**
 * @route   GET /api/customer-tags
 * @desc    获取我的标记客户列表（卖家）
 * @access  Private
 */
router.get('/', authMiddleware, customerTagController.getMyTaggedCustomers.bind(customerTagController));

/**
 * @route   GET /api/customer-tags/my
 * @desc    获取我的老客户标签（买家视角）
 * @access  Private
 */
router.get('/my', authMiddleware, customerTagController.getMyTags.bind(customerTagController));

/**
 * @route   GET /api/customer-tags/from-seller/:sellerId
 * @desc    获取我在某卖家的标签
 * @access  Private
 */
router.get('/from-seller/:sellerId', authMiddleware, customerTagController.getTagFromSeller.bind(customerTagController));

/**
 * @route   DELETE /api/customer-tags/:buyerId
 * @desc    取消标记
 * @access  Private
 */
router.delete('/:buyerId', authMiddleware, customerTagController.untagCustomer.bind(customerTagController));

/**
 * @route   PUT /api/customer-tags/:buyerId/discount
 * @desc    更新折扣率
 * @access  Private
 */
router.put('/:buyerId/discount', authMiddleware, customerTagController.updateDiscountRate.bind(customerTagController));

export default router;
