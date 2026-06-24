import { Router } from 'express';
import { alertController } from '../controllers/alert.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// 所有预警路由需要登录
router.use(authMiddleware);

/**
 * @route   GET /api/alerts/unread-count
 * @desc    获取未读预警数量
 */
router.get('/unread-count', alertController.getUnreadCount.bind(alertController));

/**
 * @route   GET /api/alerts
 * @desc    获取预警列表
 */
router.get('/', alertController.getAlerts.bind(alertController));

/**
 * @route   POST /api/alerts/read-all
 * @desc    全部标记已读
 */
router.post('/read-all', alertController.markAllAsRead.bind(alertController));

/**
 * @route   PATCH /api/alerts/:id/read
 * @desc    标记已读
 */
router.patch('/:id/read', alertController.markAsRead.bind(alertController));

export default router;
