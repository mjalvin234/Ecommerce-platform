import { Request, Response, NextFunction } from 'express';
import { favoriteService } from '../services/favorite.service.js';
import { success } from '../utils/response.js';

export class FavoriteController {
  /**
   * 添加收藏
   * POST /api/favorites
   */
  async addFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      const { inventoryId, note } = req.body;
      const userId = req.user!.id;

      const result = await favoriteService.addFavorite(userId, inventoryId, note);
      return success(res, result, '收藏成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取消收藏
   * DELETE /api/favorites/:inventoryId
   */
  async removeFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      const { inventoryId } = req.params;
      const userId = req.user!.id;

      const result = await favoriteService.removeFavorite(userId, inventoryId);
      return success(res, { success: result }, result ? '取消收藏成功' : '取消收藏失败');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取收藏列表
   * GET /api/favorites
   */
  async getFavorites(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', pageSize = '20' } = req.query;
      const userId = req.user!.id;

      const result = await favoriteService.getUserFavorites(userId, {
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10),
      });

      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 检查收藏状态
   * POST /api/favorites/check
   */
  async checkFavorites(req: Request, res: Response, next: NextFunction) {
    try {
      const { inventoryIds } = req.body;
      const userId = req.user!.id;

      const result = await favoriteService.checkFavorites(userId, inventoryIds);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取收藏数量
   * GET /api/favorites/count
   */
  async getFavoriteCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const count = await favoriteService.getFavoriteCount(userId);
      return success(res, { count });
    } catch (error) {
      next(error);
    }
  }
}

export const favoriteController = new FavoriteController();
