import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database.js';
import { orderRepository } from '../repositories/order.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { messageService } from './message.service.js';
import { settlementService } from './settlement.service.js';
import { paymentService } from './payment.service.js';
import { CreateOrderInput, ShipOrderInput } from '../validators/order.validator.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../middlewares/error.middleware.js';

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}${random}`;
}

/**
 * 扣减库存（事务内调用，防止并发超卖）
 * 只扣减 availableQty，quantity 保持不变（quantity=总量，availableQty=可用量）
 */
async function deductInventory(inventoryId: string, quantity: number): Promise<void> {
  const repo = AppDataSource.getRepository(
    (await import('../models/Inventory.js')).Inventory
  );

  const result = await repo.increment(
    { id: inventoryId, availableQty: (() => { throw new Error('use raw sql'); })() },
    'availableQty',
    -quantity
  );

  // 使用原生 SQL 实现原子扣减（带条件判断防止超卖）
  const rawResult = await AppDataSource.query(
    `UPDATE inventory SET available_qty = available_qty - ?, quantity = quantity - ? WHERE id = ? AND available_qty >= ?`,
    [quantity, quantity, inventoryId, quantity]
  );

  if (rawResult.affectedRows === 0 || rawResult[0]?.affectedRows === 0) {
    throw new ValidationError('库存不足，无法完成操作');
  }
}

/**
 * 恢复库存（取消订单时调用）
 */
async function restoreInventory(inventoryId: string, quantity: number): Promise<void> {
  await AppDataSource.query(
    `UPDATE inventory SET available_qty = available_qty + ?, quantity = quantity + ? WHERE id = ?`,
    [quantity, quantity, inventoryId]
  );
}

export class OrderService {
  /**
   * 议价成交后创建订单（由 negotiation.service 调用）
   * 包含库存校验和扣减
   */
  async createFromNegotiation(
    buyerId: string,
    sellerId: string,
    inventoryId: string,
    price: number,
    quantity: number,
    negotiationId: string
  ) {
    const inventory = await inventoryRepository.findById(inventoryId);
    if (!inventory) {
      throw new NotFoundError('库存不存在');
    }

    // 校验库存余量
    if (inventory.availableQty < quantity) {
      throw new ValidationError('库存不足，议价无法成交');
    }

    // 使用事务保证原子性
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 原子扣减库存
      await queryRunner.query(
        `UPDATE inventory SET available_qty = available_qty - ?, quantity = quantity - ? WHERE id = ? AND available_qty >= ?`,
        [quantity, quantity, inventoryId, quantity]
      );

      const order = await orderRepository.create({
        id: uuidv4(),
        orderNumber: generateOrderNumber(),
        buyerId,
        sellerId,
        negotiationId,
        inventoryId,
        partNumber: inventory.partNumber,
        quantity,
        unitPrice: price,
        totalAmount: price * quantity,
        status: 'awaiting_payment',
        orderType: 'negotiated',
      });

      await queryRunner.commitTransaction();
      return order;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 直接购买创建订单
   */
  async create(buyerId: string, data: CreateOrderInput) {
    const inventory = await inventoryRepository.findById(data.inventoryId);
    if (!inventory) {
      throw new NotFoundError('库存不存在');
    }

    if (inventory.availableQty < data.quantity) {
      throw new ValidationError('库存不足');
    }

    if (inventory.sellerId === buyerId) {
      throw new ForbiddenError('不能购买自己的库存');
    }

    const totalAmount = inventory.price * data.quantity;

    // 使用事务保证原子性
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 原子扣减库存（带条件判断防止超卖）
      const result = await queryRunner.query(
        `UPDATE inventory SET available_qty = available_qty - ?, quantity = quantity - ? WHERE id = ? AND available_qty >= ?`,
        [data.quantity, data.quantity, data.inventoryId, data.quantity]
      );

      if (result[0]?.affectedRows === 0) {
        throw new ValidationError('库存不足，请刷新后重试');
      }

      const order = await orderRepository.create({
        id: uuidv4(),
        orderNumber: generateOrderNumber(),
        buyerId,
        sellerId: inventory.sellerId,
        inventoryId: data.inventoryId,
        partNumber: inventory.partNumber,
        quantity: data.quantity,
        unitPrice: inventory.price,
        totalAmount,
        status: 'awaiting_payment',
        orderType: data.type || 'direct',
      });

      await queryRunner.commitTransaction();

      // 发送订单创建通知（异步，不影响主流程）
      messageService.sendOrderCreatedMessage(buyerId, {
        orderNumber: order.orderNumber,
        partNumber: order.partNumber,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
      }).catch(err => console.error('发送订单创建通知失败:', err));

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        partNumber: order.partNumber,
        quantity: order.quantity,
        unitPrice: order.unitPrice,
        totalAmount: order.totalAmount,
        status: order.status,
        orderType: order.orderType,
        createdAt: order.createdAt,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getByBuyer(buyerId: string) {
    const orders = await orderRepository.findByBuyerId(buyerId);

    // 获取物流信息
    const logisticsRepo = AppDataSource.getRepository(
      (await import('../models/Logistics.js')).Logistics
    );

    const ordersWithLogistics = await Promise.all(orders.map(async (order) => {
      const logistics = await logisticsRepo.findOne({ where: { orderId: order.id } });

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        partNumber: order.partNumber,
        quantity: order.quantity,
        unitPrice: order.unitPrice,
        totalAmount: order.totalAmount,
        status: order.status,
        orderType: order.orderType,
        seller: order.seller?.anonymousHash || '匿名卖家',
        createdAt: order.createdAt,
        // 物流信息
        logistics: logistics ? {
          carrier: logistics.carrier,
          trackingNumber: logistics.trackingNumber,
          status: logistics.status,
          shippedAt: logistics.shippedAt,
          deliveredAt: logistics.deliveredAt,
        } : null,
      };
    }));

    return ordersWithLogistics;
  }

  async getBySeller(sellerId: string) {
    const orders = await orderRepository.findBySellerId(sellerId);

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      partNumber: order.partNumber,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      totalAmount: order.totalAmount,
      status: order.status,
      orderType: order.orderType,
      buyer: order.buyer?.anonymousHash || '匿名买家',
      createdAt: order.createdAt,
    }));
  }

  async getById(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenError('无权查看此订单');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      partNumber: order.partNumber,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      totalAmount: order.totalAmount,
      status: order.status,
      orderType: order.orderType,
      buyer: order.buyer?.anonymousHash,
      seller: order.seller?.anonymousHash,
      createdAt: order.createdAt,
    };
  }

  async pay(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenError('只有买家可以支付订单');
    }

    if (order.status !== 'awaiting_payment') {
      throw new ValidationError('订单状态不正确，无法支付');
    }

    const updated = await orderRepository.updateStatus(orderId, 'paid_awaiting_shipment');

    // 发送支付通知给卖家（异步）
    if (order.sellerId) {
      messageService.sendOrderPaidMessage(order.sellerId, {
        orderNumber: order.orderNumber,
        partNumber: order.partNumber,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
      }).catch(err => console.error('发送支付通知失败:', err));
    }

    return { success: true, status: updated?.status };
  }

  async ship(userId: string, orderId: string, data: ShipOrderInput) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (order.sellerId !== userId) {
      throw new ForbiddenError('只有卖家可以发货');
    }

    if (order.status !== 'paid_awaiting_shipment') {
      throw new ValidationError('订单状态不正确，无法发货');
    }

    // 创建物流记录 (Shipment - 用于QA流程)
    const shipmentRepo = AppDataSource.getRepository(
      (await import('../models/Shipment.js')).Shipment
    );
    const shipment = shipmentRepo.create({
      id: uuidv4(),
      orderId,
      stage: 'to_warehouse',
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      status: 'in_transit',
      shippedAt: new Date(),
    });
    await shipmentRepo.save(shipment);

    // 同时创建 Logistics 记录 (用于物流查询)
    const logisticsRepo = AppDataSource.getRepository(
      (await import('../models/Logistics.js')).Logistics
    );

    // 自动识别快递公司编码
    let carrierCode = 'other';
    if (data.trackingNumber.startsWith('SF')) {
      carrierCode = 'shunfeng';
    } else if (data.trackingNumber.startsWith('YT')) {
      carrierCode = 'yuantong';
    } else if (data.trackingNumber.startsWith('ZT')) {
      carrierCode = 'zhongtong';
    } else if (data.trackingNumber.startsWith('77') || data.trackingNumber.startsWith('ST')) {
      carrierCode = 'shentong';
    } else if (data.trackingNumber.startsWith('JD')) {
      carrierCode = 'jd';
    } else if (data.trackingNumber.startsWith('JT')) {
      carrierCode = 'jtexpress';
    } else if (data.trackingNumber.startsWith('DP')) {
      carrierCode = 'debangwuliu';
    }

    const logistics = logisticsRepo.create({
      id: uuidv4(),
      orderId,
      carrier: data.carrier,
      carrierCode,
      trackingNumber: data.trackingNumber,
      status: 'shipped',
      shippedAt: new Date(),
      traces: [],
    });
    await logisticsRepo.save(logistics);

    const updated = await orderRepository.updateStatus(orderId, 'qa_in_transit');

    // 发送发货通知给买家（异步）
    messageService.sendOrderShippedMessage(order.buyerId, {
      orderNumber: order.orderNumber,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
    }).catch(err => console.error('发送发货通知失败:', err));

    return { success: true, status: updated?.status, tracking: data };
  }

  async complete(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenError('只有买家可以确认收货');
    }

    // 只允许在 shipped_to_buyer 状态下确认收货
    if (order.status !== 'shipped_to_buyer') {
      throw new ValidationError('订单尚未发货给您，请等待平台质检完成后再确认收货');
    }

    const updated = await orderRepository.updateStatus(orderId, 'completed');

    // 发送订单完成通知给双方（异步）
    messageService.sendOrderCompletedMessage(order.buyerId, order.sellerId, {
      orderNumber: order.orderNumber,
      partNumber: order.partNumber,
    }).catch(err => console.error('发送完成通知失败:', err));

    // 自动创建结算单（异步，不影响主流程）
    settlementService.createSettlement(orderId).catch(err => {
      console.error('创建结算单失败:', err);
    });

    return { success: true, status: updated?.status };
  }

  /**
   * QA收货确认
   */
  async qaReceive(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (order.status !== 'qa_in_transit') {
      throw new ValidationError('订单状态不正确，无法确认收货');
    }

    // 更新Shipment状态
    const shipmentRepo = AppDataSource.getRepository(
      (await import('../models/Shipment.js')).Shipment
    );
    const shipment = await shipmentRepo.findOne({ where: { orderId } });
    if (shipment) {
      shipment.status = 'delivered';
      shipment.deliveredAt = new Date();
      await shipmentRepo.save(shipment);
    }

    const updated = await orderRepository.updateStatus(orderId, 'qa_received');
    return { success: true, status: updated?.status };
  }

  /**
   * QA质检通过
   * 将订单状态更新为 qa_passed，等待发货给买家
   */
  async qaPass(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (order.status !== 'qa_received') {
      throw new ValidationError('订单状态不正确，无法标记为质检通过');
    }

    const updated = await orderRepository.updateStatus(orderId, 'qa_passed');

    // 通知买家质检通过
    messageService.sendQaPassedMessage(order.buyerId, {
      orderNumber: order.orderNumber,
      partNumber: order.partNumber,
    }).catch(err => console.error('发送质检通过通知失败:', err));

    return { success: true, status: updated?.status };
  }

  /**
   * 质检通过，发货给买家
   */
  async qaShipToBuyer(
    userId: string,
    orderId: string,
    data: { carrier: string; trackingNumber: string }
  ) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    // 只允许 qa_passed 或 qa_received 状态发货（兼容旧流程）
    if (order.status !== 'qa_passed' && order.status !== 'qa_received') {
      throw new ValidationError('订单状态不正确，无法发货。请先完成质检通过操作');
    }

    // 创建发往买家的物流记录
    const shipmentRepo = AppDataSource.getRepository(
      (await import('../models/Shipment.js')).Shipment
    );
    const shipment = shipmentRepo.create({
      id: uuidv4(),
      orderId,
      stage: 'to_buyer',
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      status: 'in_transit',
      shippedAt: new Date(),
    });
    await shipmentRepo.save(shipment);

    // 更新或创建物流记录
    const logisticsRepo = AppDataSource.getRepository(
      (await import('../models/Logistics.js')).Logistics
    );
    let logistics = await logisticsRepo.findOne({ where: { orderId } });
    if (logistics) {
      logistics.carrier = data.carrier;
      logistics.trackingNumber = data.trackingNumber;
      logistics.status = 'in_transit';
      await logisticsRepo.save(logistics);
    } else {
      logistics = logisticsRepo.create({
        id: uuidv4(),
        orderId,
        carrier: data.carrier,
        carrierCode: 'other',
        trackingNumber: data.trackingNumber,
        status: 'in_transit',
        shippedAt: new Date(),
        traces: [],
      });
      await logisticsRepo.save(logistics);
    }

    const updated = await orderRepository.updateStatus(orderId, 'shipped_to_buyer');

    // 通知买家
    messageService.sendOrderShippedMessage(order.buyerId, {
      orderNumber: order.orderNumber,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
    }).catch(err => console.error('发送发货通知失败:', err));

    return { success: true, status: updated?.status, tracking: data };
  }

  /**
   * 质检失败，退回给卖家
   */
  async qaReject(
    userId: string,
    orderId: string,
    reason: string
  ) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (order.status !== 'qa_received' && order.status !== 'qa_in_transit') {
      throw new ValidationError('订单状态不正确');
    }

    // 更新订单状态为质检失败
    const updated = await orderRepository.updateStatus(orderId, 'qa_failed');

    // 恢复库存
    if (order.inventoryId) {
      await restoreInventory(order.inventoryId, order.quantity);
    }

    // 退款给买家
    const refundResult = await paymentService.refundByOrderId(orderId, `质检失败: ${reason}`);
    if (refundResult.success) {
      console.log(`[QA质检失败] 订单 ${order.orderNumber} 已退款: ${refundResult.refundNo || '模拟退款'}`);
    } else {
      console.error(`[QA质检失败] 订单 ${order.orderNumber} 退款失败: ${refundResult.message}`);
    }

    // 通知双方
    messageService.sendOrderCancelledMessage(order.buyerId, order.sellerId, {
      orderNumber: order.orderNumber,
    }).catch(err => console.error('发送取消通知失败:', err));

    // 发送退款通知给买家
    messageService.sendRefundMessage(order.buyerId, {
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      reason: `质检失败: ${reason}`,
      refundNo: refundResult.refundNo,
    }).catch(err => console.error('发送退款通知失败:', err));

    return {
      success: true,
      status: updated?.status,
      reason,
      refund: refundResult,
    };
  }

  /**
   * 获取QA待处理订单
   */
  async getQaOrders(page: number = 1, pageSize: number = 20, status?: string) {
    const offset = (page - 1) * pageSize;

    let whereClause = 'status IN (?, ?, ?)';
    let params: any[] = ['qa_in_transit', 'qa_received', 'qa_failed'];

    if (status) {
      whereClause = 'status = ?';
      params = [status];
    }

    const orders = await AppDataSource.query(
      `SELECT o.id, o.order_number, o.part_number, o.quantity, o.total_amount, o.status, o.created_at,
              u.company_name as seller_name, u.anonymous_hash as seller_hash
       FROM orders o
       LEFT JOIN users u ON o.seller_id = u.id
       WHERE ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    // 获取总数
    const countResult = await AppDataSource.query(
      `SELECT COUNT(*) as total FROM orders WHERE ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    // 获取物流信息
    const orderIds = orders.map((o: any) => o.id);
    let logisticsMap: Record<string, any> = {};

    if (orderIds.length > 0) {
      const logistics = await AppDataSource.query(
        `SELECT "orderId", carrier, "trackingNumber", status, "shippedAt"
         FROM logistics
         WHERE "orderId" IN (${orderIds.map(() => '?').join(',')})`,
        orderIds
      );
      logistics.forEach((l: any) => {
        logisticsMap[l.orderId] = l;
      });
    }

    const items = orders.map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      partNumber: o.part_number,
      quantity: o.quantity,
      totalAmount: o.total_amount,
      status: o.status,
      sellerName: o.seller_name,
      sellerHash: o.seller_hash,
      createdAt: o.created_at,
      logistics: logisticsMap[o.id] || null,
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * QA统计
   */
  async getQaStats() {
    const stats = await AppDataSource.query(`
      SELECT
        COUNT(CASE WHEN status = 'qa_in_transit' THEN 1 END) as in_transit,
        COUNT(CASE WHEN status = 'qa_received' THEN 1 END) as received,
        COUNT(CASE WHEN status = 'qa_failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'shipped_to_buyer' THEN 1 END) as shipped
      FROM orders
    `);

    return {
      inTransit: stats[0]?.in_transit || 0,
      received: stats[0]?.received || 0,
      failed: stats[0]?.failed || 0,
      shipped: stats[0]?.shipped || 0,
    };
  }

  async cancel(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenError('无权取消此订单');
    }

    if (order.status !== 'awaiting_payment') {
      throw new ValidationError('只能取消待支付的订单');
    }

    // 使用正确的 inventoryId 恢复库存
    if (order.inventoryId) {
      await restoreInventory(order.inventoryId, order.quantity);
    }

    const updated = await orderRepository.updateStatus(orderId, 'cancelled');

    // 发送订单取消通知给双方（异步）
    messageService.sendOrderCancelledMessage(order.buyerId, order.sellerId, {
      orderNumber: order.orderNumber,
    }).catch(err => console.error('发送取消通知失败:', err));

    return { success: true, status: updated?.status };
  }
}

export const orderService = new OrderService();
