import { Request, Response, NextFunction } from 'express';
import { certificationService } from '../services/certification.service.js';
import { success } from '../utils/response.js';

export class CertificationController {
  /**
   * 提交认证申请
   * POST /api/certifications
   */
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await certificationService.submit(userId, req.body);
      return success(res, result, '认证申请已提交', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取我的认证状态
   * GET /api/certifications/my
   */
  async getMyCertification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await certificationService.getMyCertification(userId);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取认证详情
   * GET /api/certifications/:id
   */
  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await certificationService.getDetail(userId, id);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取待审核列表（管理员）
   * GET /api/certifications/pending
   */
  async getPendingList(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', pageSize = '20' } = req.query;
      const result = await certificationService.getPendingList(
        parseInt(page as string, 10),
        parseInt(pageSize as string, 10)
      );
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 审核通过（管理员）
   * POST /api/certifications/:id/approve
   */
  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewerId = req.user!.id;
      const { id } = req.params;
      const result = await certificationService.approve(id, reviewerId);
      return success(res, result, '认证已通过');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 审核拒绝（管理员）
   * POST /api/certifications/:id/reject
   */
  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewerId = req.user!.id;
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: { message: '请提供拒绝原因' },
        });
      }

      const result = await certificationService.reject(id, reviewerId, reason);
      return success(res, result, '认证已拒绝');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 重新提交认证
   * POST /api/certifications/resubmit
   */
  async resubmit(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await certificationService.resubmit(userId, req.body);
      return success(res, result, '认证申请已重新提交');
    } catch (error) {
      next(error);
    }
  }
}

export const certificationController = new CertificationController();
