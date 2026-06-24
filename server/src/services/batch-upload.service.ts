import { AppDataSource } from '../config/database.js';
import { BatchUpload, BatchUploadStatus } from '../models/BatchUpload.js';
import { Inventory } from '../models/Inventory.js';
import * as xlsx from 'xlsx';

const batchUploadRepo = () => AppDataSource.getRepository(BatchUpload);
const inventoryRepo = () => AppDataSource.getRepository(Inventory);

export interface InventoryUploadData {
  partNumber: string;
  quantity: number;
  year?: string;
  price: number;
  eccn?: string;
  leadTime?: string;
}

export interface UploadResult {
  id: string;
  fileName: string;
  totalCount: number;
  successCount: number;
  failCount: number;
  status: BatchUploadStatus;
  errors?: Array<{ row: number; field: string; message: string }>;
}

export const batchUploadService = {
  async parseExcel(buffer: Buffer): Promise<InventoryUploadData[]> {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: ['partNumber', 'quantity', 'year', 'price', 'eccn', 'leadTime'], range: 1 });
    return data as InventoryUploadData[];
  },

  validateRow(row: InventoryUploadData, rowNum: number): { valid: boolean; errors: Array<{ row: number; field: string; message: string }> } {
    const errors: Array<{ row: number; field: string; message: string }> = [];

    if (!row.partNumber || typeof row.partNumber !== 'string') {
      errors.push({ row: rowNum, field: 'partNumber', message: '型号不能为空' });
    }

    if (!row.quantity || isNaN(Number(row.quantity)) || Number(row.quantity) <= 0) {
      errors.push({ row: rowNum, field: 'quantity', message: '数量必须大于0' });
    }

    if (!row.price || isNaN(Number(row.price)) || Number(row.price) <= 0) {
      errors.push({ row: rowNum, field: 'price', message: '单价必须大于0' });
    }

    return { valid: errors.length === 0, errors };
  },

  async processUpload(fileBuffer: Buffer, fileName: string, sellerId: string): Promise<UploadResult> {
    // 创建上传记录
    const upload = batchUploadRepo().create({
      sellerId,
      fileName,
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      status: 'processing',
      errors: []
    });
    await batchUploadRepo().save(upload);

    try {
      // 解析Excel
      const data = await this.parseExcel(fileBuffer);
      upload.totalCount = data.length;

      const allErrors: Array<{ row: number; field: string; message: string }> = [];
      const validData: InventoryUploadData[] = [];

      // 校验每一行
      data.forEach((row, index) => {
        const rowNum = index + 2; // Excel 行号从2开始（第1行是表头）
        const { valid, errors } = this.validateRow(row, rowNum);
        if (valid) {
          validData.push({
            partNumber: String(row.partNumber),
            quantity: Number(row.quantity),
            year: row.year ? String(row.year) : undefined,
            price: Number(row.price),
            eccn: row.eccn ? String(row.eccn) : undefined,
            leadTime: row.leadTime ? String(row.leadTime) : undefined
          });
        } else {
          allErrors.push(...errors);
        }
      });

      // 批量创建库存
      for (const item of validData) {
        const inventory = inventoryRepo().create({
          sellerId,
          partNumber: item.partNumber,
          quantity: item.quantity,
          availableQty: item.quantity,
          year: item.year,
          price: item.price,
          eccn: item.eccn,
          leadTime: item.leadTime,
          status: 'active'
        });
        await inventoryRepo().save(inventory);
      }

      upload.successCount = validData.length;
      upload.failCount = allErrors.length;
      upload.errors = allErrors;
      upload.status = 'completed';
    } catch (err: any) {
      upload.status = 'failed';
      upload.errors = [{ row: 0, field: 'file', message: err.message || '文件解析失败' }];
    }

    await batchUploadRepo().save(upload);

    return {
      id: upload.id,
      fileName: upload.fileName,
      totalCount: upload.totalCount,
      successCount: upload.successCount,
      failCount: upload.failCount,
      status: upload.status,
      errors: upload.errors
    };
  },

  async getHistory(sellerId: string, page: number = 1, pageSize: number = 20) {
    const [items, total] = await batchUploadRepo().findAndCount({
      where: { sellerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    return { items, total, page, pageSize };
  },

  async getTemplate(): Promise<Buffer> {
    const headers = ['型号', '数量', '年份', '单价', 'ECCN', '交期'];
    const exampleData = ['STM32F103C8T6', '1000', '2023', '5.50', 'EAR99', '3-5天'];

    const ws = xlsx.utils.aoa_to_sheet([headers, exampleData]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, '库存导入模板');

    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
};
