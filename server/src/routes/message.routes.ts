import { Router } from 'express';
import { messageController } from '../controllers/message.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// 所有消息路由都需要认证
router.use(authMiddleware);

/**
 * @route   GET /api/messages
 * @desc    获取消息列表
 * @query   type, category, page, pageSize
 */
router.get('/', messageController.getMessages.bind(messageController));

/**
 * @route   GET /api/messages/unread-count
 * @desc    获取未读消息数量
 */
router.get('/unread-count', messageController.getUnreadCount.bind(messageController));

/**
 * @route   PATCH /api/messages/read-all
 * @desc    标记全部已读
 */
router.patch('/read-all', messageController.markAllAsRead.bind(messageController));

/**
 * @route   PATCH /api/messages/:id/read
 * @desc    标记单条消息已读
 */
router.patch('/:id/read', messageController.markAsRead.bind(messageController));

/**
 * @route   DELETE /api/messages/:id
 * @desc    删除消息
 */
router.delete('/:id', messageController.deleteMessage.bind(messageController));

export default router;
