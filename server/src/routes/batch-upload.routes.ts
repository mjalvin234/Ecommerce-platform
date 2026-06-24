import { Router, Request, Response } from 'express';
import multer from 'multer';
import { batchUploadService } from '../services/batch-upload.service.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// 配置multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel文件(.xlsx, .xls)'));
    }
  }
});

// 下载模板
router.get('/template', authMiddleware, async (req: Request, res: Response) => {
  try {
    const buffer = await batchUploadService.getTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=batch-upload-template.xlsx');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 上传文件
router.post('/', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'seller') {
      return res.status(403).json({ success: false, error: { message: '只有卖家才能批量上传' } });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: '请上传文件' } });
    }

    const result = await batchUploadService.processUpload(req.file.buffer, req.file.originalname, user.id);

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 上传历史
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await batchUploadService.getHistory(user.id, page, pageSize);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
