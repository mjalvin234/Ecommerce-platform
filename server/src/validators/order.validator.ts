import { z } from 'zod';

export const createOrderSchema = z.object({
  inventoryId: z.string().uuid('库存ID格式不正确'),
  quantity: z.number().int().positive('数量必须为正整数'),
  type: z.enum(['direct', 'negotiated']).optional().default('direct'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['awaiting_payment', 'paid_awaiting_shipment', 'qa_in_transit', 'shipped_to_buyer', 'completed', 'cancelled']),
});

export const shipOrderSchema = z.object({
  carrier: z.string().min(1, '承运商不能为空'),
  trackingNumber: z.string().min(1, '运单号不能为空'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ShipOrderInput = z.infer<typeof shipOrderSchema>;
