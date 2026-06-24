import { Router } from 'express';
import { tieredPriceController } from '../controllers/tieredPrice.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/tiered-prices/:inventoryId
 * @desc    获取阶梯价格
 * @access  Public
 */
router.get('/:inventoryId', tieredPriceController.getTieredPrices.bind(tieredPriceController));

/**
 * @route   POST /api/tiered-prices/:inventoryId
 * @desc    设置阶梯价格
 * @access  Private
 */
router.post('/:inventoryId', authMiddleware, tieredPriceController.setTieredPrices.bind(tieredPriceController));

/**
 * @route   DELETE /api/tiered-prices/:inventoryId
 * @desc    删除阶梯价格
 * @access  Private
 */
router.delete('/:inventoryId', authMiddleware, tieredPriceController.deleteTieredPrices.bind(tieredPriceController));

/**
 * @route   POST /api/tiered-prices/:inventoryId/calculate
 * @desc    计算价格
 * @access  Public
 */
router.post('/:inventoryId/calculate', tieredPriceController.calculatePrice.bind(tieredPriceController));

export default router;
