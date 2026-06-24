import { Router, Request, Response, NextFunction } from 'express';
import { certificationUpload, getFileUrl, validateAndSaveFile } from '../middlewares/upload.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { success } from '../utils/response.js';

const router = Router();

/**
 * @route   POST /api/uploads/certification
 * @desc    上传认证文件（营业执照、身份证等）
 * @access  Private
 */
router.post(
  '/certification',
  authMiddleware,
  certificationUpload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: '请选择要上传的文件' },
        });
      }

      // 获取用户ID
      const userId = (req as any).user?.id || 'anonymous';

      // 验证文件魔数并保存
      const result = validateAndSaveFile(req.file, userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { message: result.error || '文件验证失败' },
        });
      }

      // 生成访问URL
      const fileUrl = getFileUrl(result.filename!);

      return success(res, {
        filename: result.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      }, '文件上传成功');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/uploads/certification/:filename
 * @desc    获取认证文件
 * @access  Private
 */
router.get(
  '/certification/:filename',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filename } = req.params;

      // 安全检查：防止路径遍历攻击
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({
          success: false,
          error: { message: '无效的文件名' },
        });
      }

      const path = await import('path');
      const fs = await import('fs');
      const filePath = path.join('uploads/certifications', filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: { message: '文件不存在' },
        });
      }

      res.sendFile(path.resolve(filePath));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
