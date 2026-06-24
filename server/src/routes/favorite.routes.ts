import { Router } from 'express';
import { favoriteController } from '../controllers/favorite.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// 所有收藏路由需要登录
router.use(authMiddleware);

/**
 * @route   GET /api/favorites
 * @desc    获取收藏列表
 */
router.get('/', favoriteController.getFavorites.bind(favoriteController));

/**
 * @route   GET /api/favorites/count
 * @desc    获取收藏数量
 */
router.get('/count', favoriteController.getFavoriteCount.bind(favoriteController));

/**
 * @route   POST /api/favorites/check
 * @desc    批量检查收藏状态
 */
router.post('/check', favoriteController.checkFavorites.bind(favoriteController));

/**
 * @route   POST /api/favorites
 * @desc    添加收藏
 */
router.post('/', favoriteController.addFavorite.bind(favoriteController));

/**
 * @route   DELETE /api/favorites/:inventoryId
 * @desc    取消收藏
 */
router.delete('/:inventoryId', favoriteController.removeFavorite.bind(favoriteController));

export default router;
