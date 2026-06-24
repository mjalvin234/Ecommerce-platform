import { Router, Request, Response } from 'express';
import { exportService } from '../services/export.service.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// 创建导出任务
router.post('/:type', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const type = req.params.type as 'orders' | 'inventory' | 'transactions';
    const { filters, columns } = req.body;

    if (!['orders', 'inventory', 'transactions'].includes(type)) {
      return res.status(400).json({ success: false, error: { message: '无效的导出类型' } });
    }

    const task = await exportService.createExportTask(user.id, type, filters, columns);
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 获取导出历史
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await exportService.getExportHistory(user.id, page, pageSize);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 获取导出任务状态
router.get('/task/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const task = await exportService.getExportTask(req.params.id, user.id);
    if (!task) {
      return res.status(404).json({ success: false, error: { message: '任务不存在' } });
    }
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// 下载导出文件
router.get('/download/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const task = await exportService.getExportTask(req.params.id, user.id);

    if (!task || task.status !== 'completed') {
      return res.status(400).json({ success: false, error: { message: '文件不可下载' } });
    }

    const fileBuffer = await exportService.getExportFile(req.params.id);
    if (!fileBuffer) {
      return res.status(404).json({ success: false, error: { message: '文件不存在' } });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(task.fileName || 'export.xlsx')}"`);
    res.send(fileBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
