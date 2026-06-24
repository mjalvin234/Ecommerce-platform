import { v4 as uuidv4 } from 'uuid';
import { negotiationRepository } from '../repositories/negotiation.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { orderService } from './order.service.js';
import { messageService } from './message.service.js';
import { CreateNegotiationInput } from '../validators/negotiation.validator.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../middlewares/error.middleware.js';

export class NegotiationService {
  async create(buyerId: string, data: CreateNegotiationInput) {
    const inventory = await inventoryRepository.findById(data.inventoryId);
    if (!inventory) {
      throw new NotFoundError('库存不存在');
    }

    if (inventory.availableQty < data.quantity) {
      throw new ValidationError('库存不足');
    }

    if (inventory.sellerId === buyerId) {
      throw new ForbiddenError('不能对自己发起议价');
    }

    // 检查是否已有该买家对该库存的 pending 议价（防止重复议价）
    const existingNegotiations = await negotiationRepository.findByBuyerId(buyerId);
    const duplicate = existingNegotiations.find(
      (n: any) => n.inventoryId === data.inventoryId && n.status === 'pending'
    );
    if (duplicate) {
      throw new ValidationError('您已对该库存发起过议价，请等待卖家处理');
    }

    // 议价出价合理性校验
    if (data.offerPrice > inventory.price) {
      throw new ValidationError('议价出价不应高于挂牌价，如需原价购买请直接下单');
    }

    // 设置过期时间（7天后）
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const negotiation = await negotiationRepository.create({
      id: uuidv4(),
      buyerId,
      sellerId: inventory.sellerId,
      inventoryId: inventory.id,
      sellerPrice: inventory.price,
      offerPrice: data.offerPrice,
      quantity: data.quantity,
      status: 'pending',
      expiresAt,
    });

    // 发送议价通知给卖家（异步）
    messageService.sendNegotiationReceivedMessage(inventory.sellerId, {
      negotiationId: negotiation.id,
      partNumber: inventory.partNumber,
      offerPrice: data.offerPrice,
      quantity: data.quantity,
    }).catch(err => console.error('发送议价通知失败:', err));

    return {
      id: negotiation.id,
      partNumber: inventory.partNumber,
      sellerPrice: negotiation.sellerPrice,
      offerPrice: negotiation.offerPrice,
      quantity: negotiation.quantity,
      status: negotiation.status,
      expiresAt: negotiation.expiresAt,
    };
  }

  async getByBuyer(buyerId: string) {
    const negotiations = await negotiationRepository.findByBuyerId(buyerId);

    return negotiations.map((neg: any) => ({
      id: neg.id,
      partNumber: neg.inventory?.partNumber || '',
      sellerPrice: neg.sellerPrice,
      offerPrice: neg.offerPrice,
      quantity: neg.quantity,
      status: neg.status,
      seller: neg.seller?.anonymousHash || '匿名卖家',
      createdAt: neg.createdAt,
    }));
  }

  async getBySeller(sellerId: string) {
    const negotiations = await negotiationRepository.findBySellerId(sellerId);

    return negotiations.map((neg: any) => ({
      id: neg.id,
      partNumber: neg.inventory?.partNumber || '',
      sellerPrice: neg.sellerPrice,
      offerPrice: neg.offerPrice,
      quantity: neg.quantity,
      status: neg.status,
      buyer: neg.buyer?.anonymousHash || '匿名买家',
      createdAt: neg.createdAt,
    }));
  }

  async accept(userId: string, negotiationId: string) {
    const negotiation = await negotiationRepository.findById(negotiationId);
    if (!negotiation) {
      throw new NotFoundError('议价不存在');
    }

    if (negotiation.sellerId !== userId) {
      throw new ForbiddenError('只有卖家可以接受议价');
    }

    if (negotiation.status !== 'pending') {
      throw new ValidationError('该议价已处理');
    }

    // 检查议价是否已过期
    if (negotiation.expiresAt && new Date(negotiation.expiresAt) < new Date()) {
      await negotiationRepository.updateStatus(negotiationId, 'expired');
      throw new ValidationError('该议价已过期');
    }

    // 重新校验库存余量
    const inventory = await inventoryRepository.findById(negotiation.inventoryId);
    if (!inventory) {
      await negotiationRepository.updateStatus(negotiationId, 'rejected');
      throw new NotFoundError('关联库存已不存在，议价已自动关闭');
    }

    if (inventory.availableQty < negotiation.quantity) {
      await negotiationRepository.updateStatus(negotiationId, 'rejected');
      throw new ValidationError(`库存不足（当前可用 ${inventory.availableQty} 件，需要 ${negotiation.quantity} 件），议价已自动关闭`);
    }

    // 更新议价状态
    await negotiationRepository.updateStatus(negotiationId, 'accepted');

    // 创建订单（orderService.createFromNegotiation 内部已包含库存扣减和事务保护）
    const order = await orderService.createFromNegotiation(
      negotiation.buyerId,
      negotiation.sellerId,
      negotiation.inventoryId,
      negotiation.offerPrice,
      negotiation.quantity,
      negotiationId
    );

    // 发送议价接受通知给买家（异步）
    messageService.sendNegotiationAcceptedMessage(negotiation.buyerId, {
      negotiationId: negotiation.id,
      partNumber: inventory.partNumber,
      orderNumber: order.orderNumber,
    }).catch(err => console.error('发送议价接受通知失败:', err));

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    };
  }

  async reject(userId: string, negotiationId: string) {
    const negotiation = await negotiationRepository.findById(negotiationId);
    if (!negotiation) {
      throw new NotFoundError('议价不存在');
    }

    if (negotiation.sellerId !== userId) {
      throw new ForbiddenError('只有卖家可以拒绝议价');
    }

    if (negotiation.status !== 'pending') {
      throw new ValidationError('该议价已处理');
    }

    await negotiationRepository.updateStatus(negotiationId, 'rejected');

    // 发送议价拒绝通知给买家（异步）
    const inventory = await inventoryRepository.findById(negotiation.inventoryId);
    messageService.sendNegotiationRejectedMessage(negotiation.buyerId, {
      negotiationId: negotiation.id,
      partNumber: inventory?.partNumber || '',
    }).catch(err => console.error('发送议价拒绝通知失败:', err));

    return { success: true };
  }
}

export const negotiationService = new NegotiationService();
