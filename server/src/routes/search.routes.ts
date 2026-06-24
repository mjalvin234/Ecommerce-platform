import { Router } from 'express';
import { searchController } from '../controllers/search.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// 需要登录的路由
router.get('/history', authMiddleware, searchController.getHistory);
router.delete('/history', authMiddleware, searchController.clearHistory);

// 公开路由
router.get('/hot-keywords', searchController.getHotKeywords);
router.get('/hot-inventories', searchController.getHotInventories);
router.get('/promoted-inventories', searchController.getPromotedInventories);
router.get('/similar/:partNumber', searchController.getSimilarInventories);

export default router;
