import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { createOrderSchema, shipOrderSchema } from '../validators/order.validator.js';

const router = Router();

// 所有订单路由都需要认证
router.use(authMiddleware);

router.post('/', validate(createOrderSchema), orderController.create);
router.get('/buyer', orderController.getByBuyer);
router.get('/seller', orderController.getBySeller);
router.get('/:id', orderController.getById);
router.post('/:id/pay', orderController.pay);
router.post('/:id/ship', validate(shipOrderSchema), orderController.ship);
router.post('/:id/complete', orderController.complete);
router.post('/:id/cancel', orderController.cancel);

export default router;
