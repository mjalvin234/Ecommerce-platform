import { Router } from 'express';
import { packageController } from '../controllers/package.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/packages
 * @desc    创建库存包
 * @access  Private
 */
router.post('/', authMiddleware, packageController.createPackage.bind(packageController));

/**
 * @route   GET /api/packages
 * @desc    获取我的库存包列表（卖家）
 * @access  Private
 */
router.get('/', authMiddleware, packageController.getPackages.bind(packageController));

/**
 * @route   GET /api/packages/active
 * @desc    获取活跃的打包列表（买家）
 * @access  Public
 */
router.get('/active', packageController.getActivePackages.bind(packageController));

/**
 * @route   GET /api/packages/:id
 * @desc    获取包详情
 * @access  Public
 */
router.get('/:id', packageController.getPackage.bind(packageController));

/**
 * @route   PUT /api/packages/:id
 * @desc    更新包信息
 * @access  Private
 */
router.put('/:id', authMiddleware, packageController.updatePackage.bind(packageController));

/**
 * @route   DELETE /api/packages/:id
 * @desc    删除包
 * @access  Private
 */
router.delete('/:id', authMiddleware, packageController.deletePackage.bind(packageController));

/**
 * @route   POST /api/packages/:id/items
 * @desc    添加物料到包
 * @access  Private
 */
router.post('/:id/items', authMiddleware, packageController.addPackageItem.bind(packageController));

/**
 * @route   DELETE /api/packages/:id/items/:itemId
 * @desc    从包移除物料
 * @access  Private
 */
router.delete('/:id/items/:itemId', authMiddleware, packageController.removePackageItem.bind(packageController));

/**
 * @route   POST /api/packages/:id/publish
 * @desc    发布包
 * @access  Private
 */
router.post('/:id/publish', authMiddleware, packageController.publishPackage.bind(packageController));

/**
 * @route   POST /api/packages/:id/buy
 * @desc    购买包
 * @access  Private
 */
router.post('/:id/buy', authMiddleware, packageController.buyPackage.bind(packageController));

export default router;
