import { Router } from 'express';
import { certificationController } from '../controllers/certification.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = Router();

// 所有认证路由都需要登录
router.use(authMiddleware);

/**
 * @route   POST /api/certifications
 * @desc    提交认证申请
 */
router.post('/', certificationController.submit.bind(certificationController));

/**
 * @route   GET /api/certifications/my
 * @desc    获取我的认证状态
 */
router.get('/my', certificationController.getMyCertification.bind(certificationController));

/**
 * @route   POST /api/certifications/resubmit
 * @desc    重新提交认证
 */
router.post('/resubmit', certificationController.resubmit.bind(certificationController));

/**
 * @route   GET /api/certifications/pending
 * @desc    获取待审核列表（管理员）
 * @access  Private (Admin)
 */
router.get('/pending', adminMiddleware, certificationController.getPendingList.bind(certificationController));

/**
 * @route   GET /api/certifications/:id
 * @desc    获取认证详情
 */
router.get('/:id', certificationController.getDetail.bind(certificationController));

/**
 * @route   POST /api/certifications/:id/approve
 * @desc    审核通过（管理员）
 * @access  Private (Admin)
 */
router.post('/:id/approve', adminMiddleware, certificationController.approve.bind(certificationController));

/**
 * @route   POST /api/certifications/:id/reject
 * @desc    审核拒绝（管理员）
 * @access  Private (Admin)
 */
router.post('/:id/reject', adminMiddleware, certificationController.reject.bind(certificationController));

export default router;
