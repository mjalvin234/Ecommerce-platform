import { Request, Response, NextFunction } from 'express';
import { qualityService } from '../services/quality.service.js';
import { success } from '../utils/response.js';

export class QualityController {
  /**
   * 上传质检报告
   * POST /api/quality-reports
   */
  async uploadReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { orderId, reportFile, photos, videoUrl, conclusion, testItems } = req.body;

      if (!orderId || !reportFile || !conclusion) {
        return res.status(400).json({
          success: false,
          error: { message: '缺少必要参数' },
        });
      }

      const result = await qualityService.uploadReport(userId, orderId, {
        reportFile,
        photos,
        videoUrl,
        conclusion,
        testItems,
      });

      return success(res, result, '质检报告上传成功', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取订单质检报告
   * GET /api/quality-reports/order/:orderId
   */
  async getByOrderId(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { orderId } = req.params;

      const result = await qualityService.getByOrderId(orderId, userId);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取卖家报告列表
   * GET /api/quality-reports/my
   */
  async getMyReports(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page = '1', pageSize = '20' } = req.query;

      const result = await qualityService.getBySeller(
        userId,
        parseInt(page as string, 10),
        parseInt(pageSize as string, 10)
      );

      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 审核质检报告（管理员）
   * POST /api/quality-reports/:id/review
   */
  async reviewReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!['passed', 'failed'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: { message: '无效的审核状态' },
        });
      }

      const result = await qualityService.reviewReport(id, status, notes);
      return success(res, result, '审核完成');
    } catch (error) {
      next(error);
    }
  }
}

export const qualityController = new QualityController();
