import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service.js';
import { success } from '../utils/response.js';

export class AdminController {
  /**
   * 获取数据统计面板
   * GET /api/admin/statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getStatistics();
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取订单趋势
   * GET /api/admin/trend/orders?days=7|30|90
   */
  async getOrderTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const { days = '7' } = req.query;
      const daysNum = parseInt(days as string, 10);
      // 只允许 7, 30, 90
      const validDays = [7, 30, 90].includes(daysNum) ? daysNum : 7;
      const result = await adminService.getOrderTrend(validDays);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取热门型号
   * GET /api/admin/top-models
   */
  async getTopModels(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = '10' } = req.query;
      const result = await adminService.getTopModels(parseInt(limit as string, 10));
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户列表
   * GET /api/admin/users
   */
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, verificationStatus, page = '1', pageSize = '20' } = req.query;

      const result = await adminService.getUsers({
        role: role as 'buyer' | 'seller' | 'admin',
        verificationStatus: verificationStatus as 'pending' | 'verified' | 'rejected',
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10),
      });

      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户详情
   * GET /api/admin/users/:id
   */
  async getUserDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await adminService.getUserDetail(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: { message: '用户不存在' },
        });
      }

      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新用户状态
   * PATCH /api/admin/users/:id/status
   */
  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { verificationStatus, creditScore } = req.body;

      const result = await adminService.updateUserStatus(id, {
        verificationStatus,
        creditScore,
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          error: { message: '用户不存在' },
        });
      }

      return success(res, { success: true }, '更新成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取所有订单（管理员）
   * GET /api/admin/orders
   */
  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page = '1', pageSize = '20' } = req.query;

      const result = await adminService.getAllOrders({
        status: status as string,
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10),
      });

      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除用户
   * DELETE /api/admin/users/:id
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await adminService.deleteUser(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: { message: '用户不存在' },
        });
      }

      return success(res, {
        success: true,
        softDelete: result.softDelete,
      }, result.softDelete ? '用户已禁用（存在关联数据）' : '用户已删除');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取认证审核统计
   * GET /api/admin/certification/stats
   */
  async getCertificationStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getCertificationStats();
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
