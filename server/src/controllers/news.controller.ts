import { Request, Response } from 'express';
import { newsService } from '../services/news.service.js';

export const newsController = {
  // 公开接口 - 获取新闻列表
  async getList(req: Request, res: Response) {
    try {
      const { type, keyword, page, pageSize } = req.query;
      const result = await newsService.getList({
        type: type as any,
        status: 'published',
        keyword: keyword as string,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 10
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 公开接口 - 获取新闻详情
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const news = await newsService.getById(id, true);
      if (!news) {
        return res.status(404).json({ success: false, error: '新闻不存在' });
      }
      res.json({ success: true, data: news });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 管理员接口 - 创建新闻
  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = { ...req.body, authorId: user.id };
      const news = await newsService.create(data);
      res.json({ success: true, data: news });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 管理员接口 - 更新新闻
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const news = await newsService.update(id, req.body);
      res.json({ success: true, data: news });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 管理员接口 - 删除新闻
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await newsService.delete(id);
      res.json({ success: true, data: { deleted: result } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 管理员接口 - 发布新闻
  async publish(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const news = await newsService.publish(id);
      res.json({ success: true, data: news });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 管理员接口 - 归档新闻
  async archive(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const news = await newsService.archive(id);
      res.json({ success: true, data: news });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // 管理员接口 - 获取所有新闻（包含草稿）
  async getAdminList(req: Request, res: Response) {
    try {
      const { type, status, keyword, page, pageSize } = req.query;
      const result = await newsService.getList({
        type: type as any,
        status: status as any,
        keyword: keyword as string,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 10
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
