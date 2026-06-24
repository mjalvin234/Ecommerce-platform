import { Router } from 'express';
import { negotiationController } from '../controllers/negotiation.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { createNegotiationSchema } from '../validators/negotiation.validator.js';

const router = Router();

// 所有议价路由都需要认证
router.use(authMiddleware);

router.post('/', validate(createNegotiationSchema), negotiationController.create);
router.get('/buyer', negotiationController.getByBuyer);
router.get('/seller', negotiationController.getBySeller);
router.post('/:id/accept', negotiationController.accept);
router.post('/:id/reject', negotiationController.reject);

export default router;
