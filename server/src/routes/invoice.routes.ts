import { Router, Request, Response } from 'express';
import { invoiceService } from '../services/invoice.service.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// 申请开票
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { orderId, invoiceType, title, taxNumber, remark } = req.body;

    const invoice = await invoiceService.create(user.id, {
      orderId,
      invoiceType,
      title,
      taxNumber,
      remark
    });

    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// 买家发票列表
router.get('/buyer', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await invoiceService.getByBuyer(user.id, page, pageSize);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 卖家发票列表
router.get('/seller', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as any;

    const result = await invoiceService.getBySeller(user.id, status, page, pageSize);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 发票详情
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: { message: '发票不存在' } });
    }
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 处理发要（开具）
router.patch('/:id/process', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { invoiceNo } = req.body;

    const invoice = await invoiceService.process(user.id, req.params.id, invoiceNo);
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// 拒绝开票
router.patch('/:id/reject', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { reason } = req.body;

    const invoice = await invoiceService.reject(user.id, req.params.id, reason);
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// 卖家发票统计
router.get('/stats/seller', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const stats = await invoiceService.getStats(user.id);
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
