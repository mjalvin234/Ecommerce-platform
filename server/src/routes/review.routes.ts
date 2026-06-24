import { Router, Request, Response } from 'express';
import { reviewService } from '../services/review.service.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// 提交评价
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { orderId, rating, content } = req.body;

    const review = await reviewService.create(user.id, { orderId, rating, content });
    res.json({ success: true, data: review });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// 买家的评价列表
router.get('/buyer', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await reviewService.getBuyerReviews(user.id, page, pageSize);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 卖家的评价列表
router.get('/seller', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await reviewService.getBySeller(user.id, page, pageSize);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 卖家评分统计
router.get('/seller/:id/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await reviewService.getSellerStats(req.params.id);
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 库存的评价列表
router.get('/inventory/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = await reviewService.getByInventory(req.params.id, page, pageSize);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 卖家回复评价
router.post('/:id/reply', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { content } = req.body;

    const review = await reviewService.reply(user.id, req.params.id, content);
    res.json({ success: true, data: review });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// 评价详情
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const review = await reviewService.getById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: { message: '评价不存在' } });
    }
    res.json({ success: true, data: review });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
