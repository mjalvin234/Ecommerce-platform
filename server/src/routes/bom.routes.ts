import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { bomService } from '../services/bom.service.js';
import { success } from '../utils/response.js';
import multer from 'multer';

const router = Router();

// 文件上传配置
const upload = multer({
  dest: 'uploads/bom/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel(.xlsx)和CSV文件'));
    }
  }
});

/**
 * 上传BOM文件
 * POST /api/bom/import
 */
router.post('/import', authMiddleware, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: { message: '请上传文件' }
      });
    }

    // 读取文件内容
    const fs = await import('fs');
    const buffer = fs.readFileSync(file.path);

    // 解析Excel
    const items = bomService.parseExcel(buffer);

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: '文件中没有有效数据' }
      });
    }

    // 创建导入任务
    const task = await bomService.importBom(userId, file.originalname, items);

    // 清理临时文件
    fs.unlinkSync(file.path);

    return success(res, task, 'BOM文件已上传，正在处理');
  } catch (error) {
    next(error);
  }
});

/**
 * 直接导入BOM数据（JSON格式）
 * POST /api/bom/import-json
 */
router.post('/import-json', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { items, name = '手动导入' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: '请提供有效的BOM数据' }
      });
    }

    const task = await bomService.importBom(userId, name, items);
    return success(res, task, 'BOM数据已提交，正在处理');
  } catch (error) {
    next(error);
  }
});

/**
 * 获取BOM任务状态
 * GET /api/bom/tasks/:id
 */
router.get('/tasks/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const task = await bomService.getTask(id, userId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: { message: '任务不存在' }
      });
    }

    return success(res, task);
  } catch (error) {
    next(error);
  }
});

/**
 * 获取用户的BOM任务列表
 * GET /api/bom/tasks
 */
router.get('/tasks', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { page = '1', pageSize = '20' } = req.query;

    const [tasks, total] = await bomService.getUserTasks(userId, {
      limit: parseInt(pageSize as string, 10),
      offset: (parseInt(page as string, 10) - 1) * parseInt(pageSize as string, 10)
    });

    return success(res, { items: tasks, total });
  } catch (error) {
    next(error);
  }
});

/**
 * 下载匹配结果
 * GET /api/bom/tasks/:id/download
 */
router.get('/tasks/:id/download', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const task = await bomService.getTask(id, userId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: { message: '任务不存在' }
      });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: { message: '任务尚未完成' }
      });
    }

    const buffer = bomService.generateExportExcel(task);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="bom-result-${id}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

/**
 * 下载模板
 * GET /api/bom/templates
 */
router.get('/templates', (_req: Request, res: Response) => {
  // 生成模板Excel
  const xlsx = require('xlsx');
  const workbook = xlsx.utils.book_new();

  const headers = ['型号', '品牌', '数量', '目标价', '备注'];
  const example = ['STM32F103C8T6', 'ST', '100', '5.00', '用于主控板'];

  const sheet = xlsx.utils.aoa_to_sheet([headers, example]);

  // 设置列宽
  sheet['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 30 }
  ];

  xlsx.utils.book_append_sheet(workbook, sheet, 'BOM模板');

  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="bom-template.xlsx"');
  res.send(buffer);
});

export default router;
