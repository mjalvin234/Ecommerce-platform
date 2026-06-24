import { Request, Response } from 'express';
import { searchService } from '../services/search.service.js';

export const searchController = {
  // 获取搜索历史
  async getHistory(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { limit } = req.query;
      const history = await searchService.getHistory(
        user.id,
        limit ? parseInt(limit as string) : 10
      );
      res.json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 清空搜索历史
  async clearHistory(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const count = await searchService.clearHistory(user.id);
      res.json({ success: true, data: { deletedCount: count } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 获取热门搜索词
  async getHotKeywords(req: Request, res: Response) {
    try {
      const { limit } = req.query;
      const keywords = await searchService.getHotKeywords(
        limit ? parseInt(limit as string) : 10
      );
      res.json({ success: true, data: keywords });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 获取热门库存
  async getHotInventories(req: Request, res: Response) {
    try {
      const { limit } = req.query;
      const inventories = await searchService.getHotInventories(
        limit ? parseInt(limit as string) : 10
      );
      res.json({ success: true, data: inventories });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 获取推广库存
  async getPromotedInventories(req: Request, res: Response) {
    try {
      const { limit } = req.query;
      const inventories = await searchService.getPromotedInventories(
        limit ? parseInt(limit as string) : 5
      );
      res.json({ success: true, data: inventories });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 获取相似库存
  async getSimilarInventories(req: Request, res: Response) {
    try {
      const { partNumber } = req.params;
      const { limit } = req.query;
      const inventories = await searchService.getSimilarInventories(
        partNumber,
        limit ? parseInt(limit as string) : 5
      );
      res.json({ success: true, data: inventories });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
