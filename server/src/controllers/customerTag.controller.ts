import { Request, Response, NextFunction } from 'express';
import { customerTagService } from '../services/customerTag.service.js';
import { success } from '../utils/response.js';

export class CustomerTagController {
  async tagCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { buyerId, tagType, discountRate, remark } = req.body;

      if (!buyerId || !tagType) {
        return res.status(400).json({
          success: false,
          error: { message: '缺少必要参数' },
        });
      }

      const tag = await customerTagService.tagCustomer(
        userId,
        buyerId,
        tagType,
        discountRate,
        remark
      );
      return success(res, tag, '标记成功');
    } catch (error) {
      next(error);
    }
  }

  async untagCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { buyerId } = req.params;
      await customerTagService.untagCustomer(userId, buyerId);
      return success(res, null, '取消标记成功');
    } catch (error) {
      next(error);
    }
  }

  async getMyTaggedCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { tagType, page = '1', pageSize = '20' } = req.query;

      const result = await customerTagService.getMyTaggedCustomers(userId, {
        tagType: tagType as any,
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10),
      });

      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getTagFromSeller(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { sellerId } = req.params;

      const tag = await customerTagService.getMyTagFromSeller(userId, sellerId);
      return success(res, tag);
    } catch (error) {
      next(error);
    }
  }

  async updateDiscountRate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { buyerId } = req.params;
      const { discountRate } = req.body;

      if (!discountRate) {
        return res.status(400).json({
          success: false,
          error: { message: '请提供折扣率' },
        });
      }

      await customerTagService.updateDiscountRate(userId, buyerId, discountRate);
      return success(res, null, '更新成功');
    } catch (error) {
      next(error);
    }
  }

  async getMyTags(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page = '1', pageSize = '20' } = req.query;

      const result = await customerTagService.getBuyerTags(userId, {
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10),
      });

      return success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const customerTagController = new CustomerTagController();
