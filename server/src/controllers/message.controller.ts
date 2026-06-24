import { Request, Response, NextFunction } from 'express';
import { messageService } from '../services/message.service.js';
import { success } from '../utils/response.js';
import { MessageType } from '../models/Message.js';

export class MessageController {
  /**
   * 获取消息列表
   * GET /api/messages?type=order&category=order&page=1&pageSize=20
   */
  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { type, category, page = '1', pageSize = '20' } = req.query;

      const result = await messageService.getMessages(userId, {
        type: type as MessageType,
        category: category as 'order' | 'negotiation' | 'system',
        limit: parseInt(pageSize as string, 10),
        offset: (parseInt(page as string, 10) - 1) * parseInt(pageSize as string, 10),
      });

      // 获取未读数量
      const unreadCount = await messageService.getUnreadCount(userId);

      return success(res, {
        ...result,
        unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取未读消息数量
   * GET /api/messages/unread-count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await messageService.getUnreadCount(userId);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 标记单条消息已读
   * PATCH /api/messages/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const result = await messageService.markAsRead(id, userId);
      return success(res, { read: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 标记全部已读
   * PATCH /api/messages/read-all?type=order&category=order
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { type, category } = req.query;

      const result = await messageService.markAllAsRead(userId, {
        type: type as MessageType,
        category: category as 'order' | 'negotiation' | 'system',
      });

      return success(res, result, `已标记 ${result.updatedCount} 条消息为已读`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除消息
   * DELETE /api/messages/:id
   */
  async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      // 这里可以添加删除逻辑，暂不实现
      return success(res, { deleted: false }, '暂不支持删除消息');
    } catch (error) {
      next(error);
    }
  }
}

export const messageController = new MessageController();
