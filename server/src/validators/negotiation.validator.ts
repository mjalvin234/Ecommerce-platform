import { z } from 'zod';

export const createNegotiationSchema = z.object({
  inventoryId: z.string().uuid('库存ID格式不正确'),
  offerPrice: z.number().positive('报价必须为正数'),
  quantity: z.number().int().positive('数量必须为正整数'),
});

export type CreateNegotiationInput = z.infer<typeof createNegotiationSchema>;
