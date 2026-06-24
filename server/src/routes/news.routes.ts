import { Router } from 'express';
import { newsController } from '../controllers/news.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();

// 公开路由
router.get('/', newsController.getList);
router.get('/:id', newsController.getById);

// 管理员路由
router.post('/', authMiddleware, adminMiddleware, newsController.create);
router.patch('/:id', authMiddleware, adminMiddleware, newsController.update);
router.delete('/:id', authMiddleware, adminMiddleware, newsController.delete);
router.post('/:id/publish', authMiddleware, adminMiddleware, newsController.publish);
router.post('/:id/archive', authMiddleware, adminMiddleware, newsController.archive);
router.get('/admin/all', authMiddleware, adminMiddleware, newsController.getAdminList);

export default router;
