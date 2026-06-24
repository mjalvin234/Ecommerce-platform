import { AppDataSource } from '../config/database.js';
import { Invoice, InvoiceType, InvoiceStatus } from '../models/Invoice.js';
import { Order } from '../models/Order.js';

const invoiceRepo = () => AppDataSource.getRepository(Invoice);
const orderRepo = () => AppDataSource.getRepository(Order);

export interface CreateInvoiceData {
  orderId: string;
  invoiceType: InvoiceType;
  title: string;
  taxNumber: string;
  remark?: string;
}

export const invoiceService = {
  async create(buyerId: string, data: CreateInvoiceData) {
    // 验证订单
    const order = await orderRepo().findOne({
      where: { id: data.orderId },
      relations: ['buyer', 'seller']
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.buyerId !== buyerId) {
      throw new Error('无权为此订单申请开票');
    }

    if (order.status !== 'completed') {
      throw new Error('只有已完成的订单才能申请开票');
    }

    // 检查是否已开票
    const existing = await invoiceRepo().findOne({
      where: { orderId: data.orderId }
    });

    if (existing) {
      throw new Error('该订单已申请开票');
    }

    const invoice = invoiceRepo().create({
      orderId: data.orderId,
      buyerId,
      sellerId: order.sellerId,
      invoiceType: data.invoiceType,
      title: data.title,
      taxNumber: data.taxNumber,
      amount: order.totalAmount,
      status: 'pending',
      remark: data.remark
    });

    return await invoiceRepo().save(invoice);
  },

  async getByBuyer(buyerId: string, page: number = 1, pageSize: number = 20) {
    const [items, total] = await invoiceRepo().findAndCount({
      where: { buyerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: ['seller', 'order']
    });

    return { items, total, page, pageSize };
  },

  async getBySeller(sellerId: string, status?: InvoiceStatus, page: number = 1, pageSize: number = 20) {
    const where: any = { sellerId };
    if (status) where.status = status;

    const [items, total] = await invoiceRepo().findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: ['buyer', 'order']
    });

    return { items, total, page, pageSize };
  },

  async process(sellerId: string, invoiceId: string, invoiceNo: string) {
    const invoice = await invoiceRepo().findOne({
      where: { id: invoiceId }
    });

    if (!invoice) {
      throw new Error('发票申请不存在');
    }

    if (invoice.sellerId !== sellerId) {
      throw new Error('无权处理此发票');
    }

    if (invoice.status !== 'pending') {
      throw new Error('发票状态不允许处理');
    }

    invoice.status = 'issued';
    invoice.invoiceNo = invoiceNo;
    invoice.issuedAt = new Date();

    return await invoiceRepo().save(invoice);
  },

  async reject(sellerId: string, invoiceId: string, reason: string) {
    const invoice = await invoiceRepo().findOne({
      where: { id: invoiceId }
    });

    if (!invoice) {
      throw new Error('发票申请不存在');
    }

    if (invoice.sellerId !== sellerId) {
      throw new Error('无权处理此发票');
    }

    if (invoice.status !== 'pending') {
      throw new Error('发票状态不允许处理');
    }

    invoice.status = 'rejected';
    invoice.rejectReason = reason;

    return await invoiceRepo().save(invoice);
  },

  async getById(id: string) {
    return await invoiceRepo().findOne({
      where: { id },
      relations: ['buyer', 'seller', 'order']
    });
  },

  async getStats(sellerId: string) {
    const total = await invoiceRepo().count({ where: { sellerId } });
    const pending = await invoiceRepo().count({ where: { sellerId, status: 'pending' } });
    const issued = await invoiceRepo().count({ where: { sellerId, status: 'issued' } });

    return { total, pending, issued };
  }
};
