import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();

// 所有管理后台路由需要登录 + 管理员权限
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @route   GET /api/admin/statistics
 * @desc    获取数据统计面板
 */
router.get('/statistics', adminController.getStatistics.bind(adminController));

/**
 * @route   GET /api/admin/trend/orders
 * @desc    获取订单趋势
 */
router.get('/trend/orders', adminController.getOrderTrend.bind(adminController));

/**
 * @route   GET /api/admin/top-models
 * @desc    获取热门型号排行
 */
router.get('/top-models', adminController.getTopModels.bind(adminController));

/**
 * @route   GET /api/admin/users
 * @desc    获取用户列表
 */
router.get('/users', adminController.getUsers.bind(adminController));

/**
 * @route   GET /api/admin/users/:id
 * @desc    获取用户详情
 */
router.get('/users/:id', adminController.getUserDetail.bind(adminController));

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    更新用户状态
 */
router.patch('/users/:id/status', adminController.updateUserStatus.bind(adminController));

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    删除用户
 */
router.delete('/users/:id', adminController.deleteUser.bind(adminController));

/**
 * @route   GET /api/admin/orders
 * @desc    获取所有订单（管理员）
 */
router.get('/orders', adminController.getOrders.bind(adminController));

/**
 * @route   GET /api/admin/certification/stats
 * @desc    获取认证审核统计
 */
router.get('/certification/stats', adminController.getCertificationStats.bind(adminController));

export default router;
