import { AppDataSource } from '../config/database.js';
import { ExportTask } from '../models/Logistics.js';
import { Order } from '../models/Order.js';
import { Inventory } from '../models/Inventory.js';
import * as xlsx from 'xlsx';

const exportTaskRepo = () => AppDataSource.getRepository(ExportTask);
const orderRepo = () => AppDataSource.getRepository(Order);
const inventoryRepo = () => AppDataSource.getRepository(Inventory);

export const exportService = {
  async createExportTask(userId: string, type: 'orders' | 'inventory' | 'transactions', filters?: Record<string, any>, columns?: string[]): Promise<ExportTask> {
    const task = exportTaskRepo().create({
      userId,
      type,
      filters: filters || {},
      columns: columns || [],
      status: 'pending',
      totalCount: 0,
      processedCount: 0
    });

    await exportTaskRepo().save(task);

    // 异步处理导出任务
    this.processExportTask(task.id).catch(err => {
      console.error('导出任务处理失败:', err);
    });

    return task;
  },

  async processExportTask(taskId: string): Promise<void> {
    const task = await exportTaskRepo().findOne({ where: { id: taskId } });
    if (!task) return;

    try {
      task.status = 'processing';
      await exportTaskRepo().save(task);

      let data: any[] = [];
      let fileName = '';

      if (task.type === 'orders') {
        const orders = await orderRepo().find({
          where: task.filters as any,
          relations: ['buyer', 'seller', 'inventory'],
          order: { createdAt: 'DESC' }
        });
        data = orders.map(o => ({
          订单编号: o.orderNumber,
          型号: o.inventory?.partNumber || '',
          数量: o.quantity,
          金额: o.totalAmount,
          状态: o.status,
          买家: o.buyer?.companyName || '',
          卖家: o.seller?.companyName || '',
          创建时间: o.createdAt
        }));
        fileName = `订单导出_${new Date().toISOString().split('T')[0]}.xlsx`;
      } else if (task.type === 'inventory') {
        const inventories = await inventoryRepo().find({
          where: task.filters as any,
          order: { createdAt: 'DESC' }
        });
        data = inventories.map(i => ({
          型号: i.partNumber,
          数量: i.quantity,
          可用数量: i.availableQty,
          年份: i.year || '',
          单价: i.price,
          ECCN: i.eccn || '',
          交期: i.leadTime || '',
          状态: i.status,
          创建时间: i.createdAt
        }));
        fileName = `库存导出_${new Date().toISOString().split('T')[0]}.xlsx`;
      }

      task.totalCount = data.length;

      // 生成Excel
      const ws = xlsx.utils.json_to_sheet(data);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // 存储文件（实际应上传到云存储）
      const filePath = `/tmp/export_${taskId}.xlsx`;
      const fs = await import('fs');
      fs.writeFileSync(filePath, buffer);

      task.fileUrl = `/api/export/download/${taskId}`;
      task.fileName = fileName;
      task.processedCount = data.length;
      task.status = 'completed';
      task.completedAt = new Date();

      await exportTaskRepo().save(task);
    } catch (err: any) {
      task.status = 'failed';
      task.errorMessage = err.message;
      await exportTaskRepo().save(task);
    }
  },

  async getExportHistory(userId: string, page: number = 1, pageSize: number = 20) {
    const [items, total] = await exportTaskRepo().findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    return { items, total, page, pageSize };
  },

  async getExportTask(taskId: string, userId: string): Promise<ExportTask | null> {
    return await exportTaskRepo().findOne({ where: { id: taskId, userId } });
  },

  async getExportFile(taskId: string): Promise<Buffer | null> {
    const filePath = `/tmp/export_${taskId}.xlsx`;
    const fs = await import('fs');

    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    return null;
  }
};
