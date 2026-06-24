import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();

/**
 * @route   GET /api/payments/channels
 * @desc    获取可用支付方式
 * @access  Public
 */
router.get('/channels', paymentController.getChannels.bind(paymentController));

/**
 * @route   GET /api/payments/config
 * @desc    获取支付配置详情（管理员）
 * @access  Private (Admin)
 */
router.get('/config', authMiddleware, adminMiddleware, paymentController.getConfigs.bind(paymentController));

/**
 * @route   PUT /api/payments/config/:channel
 * @desc    更新支付配置（管理员）
 * @access  Private (Admin)
 */
router.put('/config/:channel', authMiddleware, adminMiddleware, paymentController.updateConfig.bind(paymentController));

/**
 * @route   POST /api/payments/config/:channel/test
 * @desc    测试支付配置连接（管理员）
 * @access  Private (Admin)
 */
router.post('/config/:channel/test', authMiddleware, adminMiddleware, paymentController.testConfig.bind(paymentController));

/**
 * @route   POST /api/payments/create
 * @desc    创建支付订单
 * @access  Private
 */
router.post('/create', authMiddleware, paymentController.createPayment.bind(paymentController));

/**
 * @route   GET /api/payments/my
 * @desc    获取用户支付记录
 * @access  Private
 */
router.get('/my', authMiddleware, paymentController.getMyPayments.bind(paymentController));

/**
 * @route   GET /api/payments/:paymentNo/status
 * @desc    查询支付状态
 * @access  Private
 */
router.get('/:paymentNo/status', authMiddleware, paymentController.queryStatus.bind(paymentController));

/**
 * @route   POST /api/payments/alipay/notify
 * @desc    支付宝回调
 * @access  Public (支付宝服务器调用)
 */
router.post('/alipay/notify', paymentController.alipayNotify.bind(paymentController));

/**
 * @route   POST /api/payments/wechat/notify
 * @desc    微信回调
 * @access  Public (微信服务器调用)
 */
router.post('/wechat/notify', paymentController.wechatNotify.bind(paymentController));

export default router;
