import { Router } from 'express';
import { followController } from '../controllers/follow.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// 所有关注路由需要登录
router.use(authMiddleware);

/**
 * @route   GET /api/follows/stats
 * @desc    获取关注统计
 */
router.get('/stats', followController.getFollowStats.bind(followController));

/**
 * @route   GET /api/follows/following
 * @desc    获取关注列表（我关注的人）
 */
router.get('/following', followController.getFollowing.bind(followController));

/**
 * @route   GET /api/follows/followers
 * @desc    获取粉丝列表（关注我的人）
 */
router.get('/followers', followController.getFollowers.bind(followController));

/**
 * @route   POST /api/follows/check
 * @desc    批量检查关注状态
 */
router.post('/check', followController.checkFollowing.bind(followController));

/**
 * @route   POST /api/follows
 * @desc    关注用户
 */
router.post('/', followController.followUser.bind(followController));

/**
 * @route   POST /api/follows/by-inventory/:inventoryId
 * @desc    通过库存ID关注卖家
 */
router.post('/by-inventory/:inventoryId', followController.followByInventory.bind(followController));

/**
 * @route   DELETE /api/follows/:userId
 * @desc    取消关注
 */
router.delete('/:userId', followController.unfollowUser.bind(followController));

export default router;
