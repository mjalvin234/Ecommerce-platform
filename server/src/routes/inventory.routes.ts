import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware.js';
import { createInventorySchema, updateInventorySchema, searchInventorySchema } from '../validators/inventory.validator.js';

const router = Router();

// 公开路由
router.get('/', validate(searchInventorySchema, 'query'), inventoryController.search);
router.get('/:id', inventoryController.getById);

// 需要认证的路由
router.get('/seller/my', authMiddleware, roleMiddleware('seller'), inventoryController.getBySeller);
router.post('/', authMiddleware, roleMiddleware('seller'), validate(createInventorySchema), inventoryController.create);
router.put('/:id', authMiddleware, roleMiddleware('seller'), validate(updateInventorySchema), inventoryController.update);
router.delete('/:id', authMiddleware, roleMiddleware('seller'), inventoryController.delete);

// 商品上下架
router.post('/:id/activate', authMiddleware, roleMiddleware('seller'), inventoryController.activate);
router.post('/:id/deactivate', authMiddleware, roleMiddleware('seller'), inventoryController.deactivate);

export default router;
