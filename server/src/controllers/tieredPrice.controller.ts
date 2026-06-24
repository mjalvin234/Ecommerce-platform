import { Request, Response, NextFunction } from 'express';
import { tieredPriceService } from '../services/tieredPrice.service.js';
import { success } from '../utils/response.js';

export class TieredPriceController {
  async getTieredPrices(req: Request, res: Response, next: NextFunction) {
    try {
      const { inventoryId } = req.params;
      const tiers = await tieredPriceService.getTieredPrices(inventoryId);
      return success(res, tiers);
    } catch (error) {
      next(error);
    }
  }

  async setTieredPrices(req: Request, res: Response, next: NextFunction) {
    try {
      const { inventoryId } = req.params;
      const { tiers } = req.body;

      if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: '请提供有效的价格区间' },
        });
      }

      const result = await tieredPriceService.setTieredPrices(inventoryId, tiers);
      return success(res, result, '设置成功');
    } catch (error) {
      next(error);
    }
  }

  async deleteTieredPrices(req: Request, res: Response, next: NextFunction) {
    try {
      const { inventoryId } = req.params;
      await tieredPriceService.deleteTieredPrices(inventoryId);
      return success(res, null, '删除成功');
    } catch (error) {
      next(error);
    }
  }

  async calculatePrice(req: Request, res: Response, next: NextFunction) {
    try {
      const { inventoryId } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          error: { message: '请提供有效的数量' },
        });
      }

      const result = await tieredPriceService.calculatePrice(inventoryId, quantity);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const tieredPriceController = new TieredPriceController();
