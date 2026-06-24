import { z } from 'zod';

export const createInventorySchema = z.object({
  partNumber: z.string().min(1, '型号不能为空'),
  quantity: z.number().int().positive('数量必须为正整数'),
  year: z.string().optional(),
  price: z.number().positive('价格必须为正数'),
  eccn: z.string().optional(),
  leadTime: z.string().optional(),
});

export const updateInventorySchema = z.object({
  partNumber: z.string().min(1, '型号不能为空').optional(),
  quantity: z.number().int().positive('数量必须为正整数').optional(),
  year: z.string().optional(),
  price: z.number().positive('价格必须为正数').optional(),
  eccn: z.string().optional(),
  leadTime: z.string().optional(),
  status: z.enum(['active', 'inactive', 'sold_out']).optional(),
});

export const searchInventorySchema = z.object({
  q: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
