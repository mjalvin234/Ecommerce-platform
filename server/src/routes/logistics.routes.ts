import { Router, Request, Response } from 'express';
import { logisticsService } from '../services/logistics.service.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// 提交物流信息
router.post('/submit', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { orderId, carrierCode, trackingNumber } = req.body;
    const logistics = await logisticsService.submitLogistics(orderId, carrierCode, trackingNumber, user.id);
    res.json({ success: true, data: logistics });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// 查询物流轨迹
router.get('/query/:trackingNumber', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await logisticsService.queryLogistics(req.params.trackingNumber);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// 自动识别快递公司
router.get('/auto-detect/:trackingNumber', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await logisticsService.autoDetectCarrier(req.params.trackingNumber);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 批量导入发货
router.post('/batch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { items } = req.body;
    const result = await logisticsService.batchSubmit(user.id, items);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// 获取订单物流信息
router.get('/order/:orderId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const logistics = await logisticsService.getLogisticsByOrder(req.params.orderId);
    res.json({ success: true, data: logistics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
