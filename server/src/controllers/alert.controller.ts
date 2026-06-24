import { Request, Response, NextFunction } from 'express';
import { alertService } from '../services/alert.service.js';
import { success } from '../utils/response.js';
import { AlertType } from '../models/InventoryAlert.js';

export class AlertController {
  /**
   * 获取预警列表
   * GET /api/alerts
   */
  async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const { alertType, isRead, page = '1', pageSize = '20' } = req.query;
      const userId = req.user!.id;

      const result = await alertService.getUserAlerts(userId, {
        alertType: alertType as AlertType,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10),
      });

      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 标记已读
   * PATCH /api/alerts/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const result = await alertService.markAsRead(userId, id);
      return success(res, { success: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 全部标记已读
   * POST /api/alerts/read-all
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      await alertService.markAllAsRead(userId);
      return success(res, { success: true }, '全部已标记为已读');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取未读数量
   * GET /api/alerts/unread-count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const count = await alertService.getUnreadCount(userId);
      return success(res, { count });
    } catch (error) {
      next(error);
    }
  }
}

export const alertController = new AlertController();
