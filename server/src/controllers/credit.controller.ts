import { Request, Response, NextFunction } from 'express';
import { creditService } from '../services/credit.service.js';
import { success } from '../utils/response.js';

export class CreditController {
  /**
   * 获取当前用户信用信息
   * GET /api/credit/info
   */
  async getMyCreditInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await creditService.getUserCreditInfo(userId);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取信用分历史
   * GET /api/credit/history
   */
  async getCreditHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', pageSize = '20' } = req.query;
      const userId = req.user!.id;

      const result = await creditService.getCreditHistory(userId, {
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10),
      });

      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户信用信息（公开）
   * GET /api/credit/user/:userId
   */
  async getUserCredit(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await creditService.getUserCreditInfo(userId);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 管理员调整信用分
   * POST /api/credit/adjust
   */
  async adminAdjust(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, amount, reason } = req.body;
      const adminId = req.user!.id;

      const result = await creditService.adminAdjust(userId, amount, adminId, reason);
      return success(res, result, '信用分调整成功');
    } catch (error) {
      next(error);
    }
  }
}

export const creditController = new CreditController();
