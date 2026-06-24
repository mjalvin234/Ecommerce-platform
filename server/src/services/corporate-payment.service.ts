import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database.js';
import { CorporatePayment, CorporatePaymentStatus } from '../models/CorporatePayment.js';
import { Order } from '../models/Order.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../middlewares/error.middleware.js';

export class CorporatePaymentService {
  /**
   * 创建对公支付申请
   */
  async createPayment(
    userId: string,
    orderId: string,
    data: {
      amount: number;
      bankName: string;
      bankAccount: string;
      proofUrl: string;
    }
  ): Promise<CorporatePayment> {
    const orderRepo = AppDataSource.getRepository(Order);
    const paymentRepo = AppDataSource.getRepository(CorporatePayment);

    // 检查订单
    const order = await orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenError('只能为自己的订单申请对公支付');
    }

    if (order.status !== 'awaiting_payment') {
      throw new ValidationError('订单状态不正确，无法申请对公支付');
    }

    // 检查是否已有对公支付申请
    const existing = await paymentRepo.findOne({ where: { orderId } });
    if (existing) {
      throw new ValidationError('该订单已有对公支付申请');
    }

    // 验证金额
    if (data.amount !== Number(order.totalAmount)) {
      throw new ValidationError('支付金额与订单金额不符');
    }

    const payment = paymentRepo.create({
      id: uuidv4(),
      orderId,
      userId,
      amount: data.amount,
      bankName: data.bankName,
      bankAccount: data.bankAccount,
      proofUrl: data.proofUrl,
      status: 'pending',
    });

    await paymentRepo.save(payment);
    console.log(`[对公支付] 创建支付申请: 订单${orderId}, 金额${data.amount}`);

    return payment;
  }

  /**
   * 获取用户对公支付记录
   */
  async getUserPayments(userId: string): Promise<CorporatePayment[]> {
    const paymentRepo = AppDataSource.getRepository(CorporatePayment);
    return paymentRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取待审核的对公支付（管理员）
   */
  async getPendingPayments(page: number = 1, pageSize: number = 20): Promise<{
    items: CorporatePayment[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const paymentRepo = AppDataSource.getRepository(CorporatePayment);
    const [items, total] = await paymentRepo.findAndCount({
      where: { status: 'pending' },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items, total, page, pageSize };
  }

  /**
   * 获取所有对公支付记录（管理员）
   */
  async getAllPayments(page: number = 1, pageSize: number = 20, status?: CorporatePaymentStatus): Promise<{
    items: CorporatePayment[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const paymentRepo = AppDataSource.getRepository(CorporatePayment);
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await paymentRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items, total, page, pageSize };
  }

  /**
   * 确认对公支付（管理员）
   */
  async confirmPayment(
    paymentId: string,
    adminId: string
  ): Promise<CorporatePayment> {
    const paymentRepo = AppDataSource.getRepository(CorporatePayment);
    const orderRepo = AppDataSource.getRepository(Order);

    const payment = await paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundError('支付记录不存在');
    }

    if (payment.status !== 'pending') {
      throw new ValidationError('该支付申请已处理');
    }

    // 更新支付状态
    payment.status = 'confirmed';
    payment.confirmedBy = adminId;
    payment.confirmedAt = new Date();
    await paymentRepo.save(payment);

    // 更新订单状态
    const order = await orderRepo.findOne({ where: { id: payment.orderId } });
    if (order) {
      order.status = 'paid_awaiting_shipment';
      await orderRepo.save(order);
    }

    console.log(`[对公支付] 管理员确认: ${paymentId}`);
    return payment;
  }

  /**
   * 拒绝对公支付（管理员）
   */
  async rejectPayment(
    paymentId: string,
    adminId: string,
    reason: string
  ): Promise<CorporatePayment> {
    const paymentRepo = AppDataSource.getRepository(CorporatePayment);

    const payment = await paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundError('支付记录不存在');
    }

    if (payment.status !== 'pending') {
      throw new ValidationError('该支付申请已处理');
    }

    payment.status = 'rejected';
    payment.confirmedBy = adminId;
    payment.confirmedAt = new Date();
    payment.rejectReason = reason;
    await paymentRepo.save(payment);

    console.log(`[对公支付] 管理员拒绝: ${paymentId}, 原因: ${reason}`);
    return payment;
  }

  /**
   * 获取支付详情
   */
  async getPaymentById(paymentId: string, userId?: string): Promise<CorporatePayment> {
    const paymentRepo = AppDataSource.getRepository(CorporatePayment);
    const payment = await paymentRepo.findOne({ where: { id: paymentId } });

    if (!payment) {
      throw new NotFoundError('支付记录不存在');
    }

    if (userId && payment.userId !== userId) {
      throw new ForbiddenError('无权查看此支付记录');
    }

    return payment;
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    pending: number;
    confirmed: number;
    rejected: number;
    totalAmount: number;
  }> {
    const paymentRepo = AppDataSource.getRepository(CorporatePayment);

    const payments = await paymentRepo.find();
    const pending = payments.filter(p => p.status === 'pending').length;
    const confirmed = payments.filter(p => p.status === 'confirmed').length;
    const rejected = payments.filter(p => p.status === 'rejected').length;
    const totalAmount = payments
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return { pending, confirmed, rejected, totalAmount };
  }
}

export const corporatePaymentService = new CorporatePaymentService();
