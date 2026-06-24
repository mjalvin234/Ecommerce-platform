import { AppDataSource } from '../config/database.js';
import { BomTask, BomItem, BomTaskStatus } from '../models/BomTask.js';
import { Inventory } from '../models/Inventory.js';
import * as xlsx from 'xlsx';

const bomTaskRepo = () => AppDataSource.getRepository(BomTask);
const inventoryRepo = () => AppDataSource.getRepository(Inventory);

export const bomService = {
  /**
   * 创建BOM导入任务
   */
  async createTask(userId: string, fileName: string, filePath?: string): Promise<BomTask> {
    const task = bomTaskRepo().create({
      userId,
      fileName,
      originalFile: filePath || null,
      status: 'pending',
      totalCount: 0,
      matchedCount: 0,
      partialCount: 0,
      notFoundCount: 0
    });

    return await bomTaskRepo().save(task);
  },

  /**
   * 解析Excel文件
   */
  parseExcel(buffer: Buffer): BomItem[] {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    // 跳过表头，解析数据行
    const items: BomItem[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue; // 跳过空行

      items.push({
        model: String(row[0] || '').trim(),
        brand: row[1] ? String(row[1]).trim() : undefined,
        quantity: parseInt(row[2], 10) || 1,
        targetPrice: row[3] ? parseFloat(row[3]) : undefined,
        remark: row[4] ? String(row[4]).trim() : undefined
      });
    }

    return items;
  },

  /**
   * 处理BOM导入任务
   */
  async processTask(taskId: string): Promise<void> {
    const task = await bomTaskRepo().findOne({ where: { id: taskId } });
    if (!task) return;

    task.status = 'processing';
    await bomTaskRepo().save(task);

    try {
      // 如果没有items，说明需要从文件读取
      if (!task.items && task.originalFile) {
        // 实际项目中应该从文件读取并解析
        task.items = [];
      }

      if (!task.items || task.items.length === 0) {
        throw new Error('没有可导入的数据');
      }

      task.totalCount = task.items.length;

      // 匹配库存
      for (const item of task.items) {
        const matched = await this.matchInventory(item);
        if (matched) {
          item.matchedInventoryId = matched.id;
          item.matchedPrice = matched.price;
          item.matchStatus = 'matched';
          task.matchedCount++;
        } else {
          item.matchStatus = 'not_found';
          task.notFoundCount++;
        }
      }

      task.status = 'completed';
      task.completedAt = new Date();
      await bomTaskRepo().save(task);

    } catch (err: any) {
      task.status = 'failed';
      task.errorMessage = err.message;
      await bomTaskRepo().save(task);
    }
  },

  /**
   * 匹配库存
   */
  async matchInventory(item: BomItem): Promise<Inventory | null> {
    // 按型号搜索库存
    const query = inventoryRepo()
      .createQueryBuilder('inventory')
      .where('inventory.status = :status', { status: 'active' })
      .andWhere('inventory.quantity >= :quantity', { quantity: item.quantity });

    // 型号匹配（支持模糊匹配）
    query.andWhere('(inventory.model LIKE :model OR inventory.model = :exactModel)', {
      model: `%${item.model}%`,
      exactModel: item.model
    });

    // 品牌匹配（如果有）
    if (item.brand) {
      query.andWhere('inventory.brand LIKE :brand', { brand: `%${item.brand}%` });
    }

    // 按价格排序（如果有目标价）
    if (item.targetPrice) {
      query.orderBy('ABS(inventory.price - :targetPrice)', 'ASC');
      query.setParameter('targetPrice', item.targetPrice);
    } else {
      query.orderBy('inventory.price', 'ASC');
    }

    return await query.getOne();
  },

  /**
   * 导入BOM（带数据）
   */
  async importBom(userId: string, fileName: string, items: BomItem[]): Promise<BomTask> {
    const task = bomTaskRepo().create({
      userId,
      fileName,
      status: 'pending',
      totalCount: items.length,
      matchedCount: 0,
      partialCount: 0,
      notFoundCount: 0,
      items
    });

    await bomTaskRepo().save(task);

    // 异步处理
    this.processTask(task.id);

    return task;
  },

  /**
   * 获取任务状态
   */
  async getTask(taskId: string, userId: string): Promise<BomTask | null> {
    return await bomTaskRepo().findOne({ where: { id: taskId, userId } });
  },

  /**
   * 获取用户的BOM任务列表
   */
  async getUserTasks(userId: string, options?: { limit?: number; offset?: number }): Promise<[BomTask[], number]> {
    return await bomTaskRepo().findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: options?.limit || 20,
      skip: options?.offset || 0
    });
  },

  /**
   * 生成导出Excel
   */
  generateExportExcel(task: BomTask): Buffer {
    const workbook = xlsx.utils.book_new();

    const headers = ['型号', '品牌', '需求数量', '目标价', '匹配状态', '匹配价格', '备注'];
    const rows: (string | number)[][] = [headers];

    if (task.items) {
      for (const item of task.items) {
        rows.push([
          item.model,
          item.brand || '',
          item.quantity,
          item.targetPrice || '',
          item.matchStatus === 'matched' ? '已匹配' : item.matchStatus === 'partial' ? '部分匹配' : '未找到',
          item.matchedPrice || '',
          item.remark || ''
        ]);
      }
    }

    const sheet = xlsx.utils.aoa_to_sheet(rows);
    xlsx.utils.book_append_sheet(workbook, sheet, 'BOM匹配结果');

    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
};
