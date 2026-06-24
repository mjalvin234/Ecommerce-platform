import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service.js';
import { success } from '../utils/response.js';

export class OrderController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const buyerId = req.user!.id;
      const result = await orderService.create(buyerId, req.body);
      return success(res, result, '订单创建成功', 201);
    } catch (error) {
      next(error);
    }
  }

  async getByBuyer(req: Request, res: Response, next: NextFunction) {
    try {
      const buyerId = req.user!.id;
      const result = await orderService.getByBuyer(buyerId);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getBySeller(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.id;
      const result = await orderService.getBySeller(sellerId);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await orderService.getById(userId, id);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async pay(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await orderService.pay(userId, id);
      return success(res, result, '支付成功');
    } catch (error) {
      next(error);
    }
  }

  async ship(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await orderService.ship(userId, id, req.body);
      return success(res, result, '发货成功');
    } catch (error) {
      next(error);
    }
  }

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await orderService.complete(userId, id);
      return success(res, result, '确认收货成功');
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await orderService.cancel(userId, id);
      return success(res, result, '订单已取消');
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
