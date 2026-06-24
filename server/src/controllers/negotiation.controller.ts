import { Request, Response, NextFunction } from 'express';
import { negotiationService } from '../services/negotiation.service.js';
import { success } from '../utils/response.js';

export class NegotiationController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const buyerId = req.user!.id;
      const result = await negotiationService.create(buyerId, req.body);
      return success(res, result, '议价申请已发送', 201);
    } catch (error) {
      next(error);
    }
  }

  async getByBuyer(req: Request, res: Response, next: NextFunction) {
    try {
      const buyerId = req.user!.id;
      const result = await negotiationService.getByBuyer(buyerId);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getBySeller(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.id;
      const result = await negotiationService.getBySeller(sellerId);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await negotiationService.accept(userId, id);
      return success(res, result, '已接受议价，订单已生成');
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await negotiationService.reject(userId, id);
      return success(res, result, '已拒绝议价');
    } catch (error) {
      next(error);
    }
  }
}

export const negotiationController = new NegotiationController();
