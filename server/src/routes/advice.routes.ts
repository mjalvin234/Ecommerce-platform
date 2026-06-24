import { Router, Request, Response } from 'express';
import { deliveryEstimateService } from '../services/delivery-estimate.service.js';
import { usageAdviceService } from '../services/usage-advice.service.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * 计算交期
 * POST /api/advice/delivery-estimate
 */
router.post('/delivery-estimate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      sellerAddress,
      buyerAddress,
      carrier,
      inventoryBrand,
      inventoryYear,
      quantity,
    } = req.body;

    if (!buyerAddress) {
      return res.status(400).json({ message: '请提供收货地址' });
    }

    // 默认QA中心在上海
    const qaCenterAddress = '上海市浦东新区';

    const result = deliveryEstimateService.calculateFullDelivery({
      sellerAddress: sellerAddress || '广东省深圳市',
      qaCenterAddress,
      buyerAddress,
      carrier,
      inventoryBrand,
      inventoryYear: inventoryYear ? Number(inventoryYear) : undefined,
      quantity: quantity || 1,
    });

    res.json({
      totalDays: result.totalDays,
      estimatedDate: result.estimatedCompletionDate,
      stages: result.stages,
      notes: result.notes,
    });
  } catch (error) {
    console.error('计算交期失败:', error);
    res.status(500).json({ message: '计算交期失败' });
  }
});

/**
 * 获取QA质检时效
 * POST /api/advice/qa-time
 */
router.post('/qa-time', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { inventoryBrand, inventoryYear, quantity } = req.body;

    const result = deliveryEstimateService.calculateQATime({
      inventoryBrand,
      inventoryYear: inventoryYear ? Number(inventoryYear) : undefined,
      quantity: quantity || 1,
    });

    res.json(result);
  } catch (error) {
    console.error('计算质检时效失败:', error);
    res.status(500).json({ message: '计算质检时效失败' });
  }
});

/**
 * 获取货物使用建议
 * GET /api/advice/usage/:inventoryId
 */
router.get('/usage/:inventoryId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { inventoryId } = req.params;

    // 这里应该从数据库获取库存信息
    // 简化处理，从请求参数获取
    const {
      brand = 'Unknown',
      model = 'Unknown',
      year = new Date().getFullYear(),
      quantity = 1,
      storageCondition,
    } = req.query;

    const advice = usageAdviceService.getChipAdvice({
      brand: String(brand),
      model: String(model),
      year: Number(year),
      quantity: Number(quantity),
      storageCondition: storageCondition ? String(storageCondition) : undefined,
    });

    res.json(advice);
  } catch (error) {
    console.error('获取使用建议失败:', error);
    res.status(500).json({ message: '获取使用建议失败' });
  }
});

/**
 * 获取存储条件建议
 * GET /api/advice/storage/:brand
 */
router.get('/storage/:brand', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { brand } = req.params;

    const advice = usageAdviceService.getStorageAdvice(brand);
    res.json(advice);
  } catch (error) {
    console.error('获取存储建议失败:', error);
    res.status(500).json({ message: '获取存储建议失败' });
  }
});

/**
 * 生成使用建议报告
 * POST /api/advice/report
 */
router.post('/report', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { brand, model, year, quantity, storageCondition } = req.body;

    const report = usageAdviceService.generateAdviceReport({
      brand,
      model,
      year: Number(year),
      quantity: Number(quantity),
      storageCondition,
    });

    res.json({ report });
  } catch (error) {
    console.error('生成报告失败:', error);
    res.status(500).json({ message: '生成报告失败' });
  }
});

export default router;
