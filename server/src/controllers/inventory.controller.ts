import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service.js';
import { success, paginated } from '../utils/response.js';

export class InventoryController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const page = parseInt((req.query.page as string) || '1');
      const pageSize = parseInt((req.query.pageSize as string) || '20');

      const result = await inventoryService.search(query, page, pageSize);
      return paginated(res, result.items, result.total, result.page, result.pageSize);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await inventoryService.getById(id);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getBySeller(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.id;
      const result = await inventoryService.getBySeller(sellerId);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user!.id;
      const result = await inventoryService.create(sellerId, req.body);
      return success(res, result, '库存创建成功', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await inventoryService.update(userId, id, req.body);
      return success(res, result, '库存更新成功');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await inventoryService.delete(userId, id);
      return success(res, result, '库存删除成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 上架商品
   * POST /api/inventory/:id/activate
   */
  async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await inventoryService.activate(userId, id);
      return success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 下架商品
   * POST /api/inventory/:id/deactivate
   */
  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await inventoryService.deactivate(userId, id);
      return success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
