import { AppDataSource } from '../config/database.js';
import { QualityReport, QualityStatus } from '../models/QualityReport.js';
import { generateReportNo } from '../models/QualityReport.js';
import { Order } from '../models/Order.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../middlewares/error.middleware.js';
import { messageService } from './message.service.js';
import { LessThan } from 'typeorm';

export class QualityService {
  private reportRepo = AppDataSource.getRepository(QualityReport);
  private orderRepo = AppDataSource.getRepository(Order);

  /**
   * 上传质检报告（卖家）
   */
  async uploadReport(
    userId: string,
    orderId: string,
    data: {
      reportFile: string;
      photos?: string[];
      videoUrl?: string;
      conclusion: string;
      testItems?: any[];
    }
  ) {
    // 检查订单
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['buyer'],
    });

    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (order.sellerId !== userId) {
      throw new ForbiddenError('无权操作此订单');
    }

    if (order.status !== 'qa_in_transit') {
      throw new ValidationError('订单状态不正确，无法上传质检报告');
    }

    // 创建质检报告
    const report = this.reportRepo.create({
      id: crypto.randomUUID(),
      reportNo: generateReportNo(),
      orderId,
      uploadedBy: userId,
      partNumber: order.partNumber,
      quantity: order.quantity,
      status: 'pending',
      ...data,
    });

    await this.reportRepo.save(report);

    return {
      id: report.id,
      reportNo: report.reportNo,
      status: report.status,
    };
  }

  /**
   * 获取订单的质检报告
   */
  async getByOrderId(orderId: string, userId: string) {
    const report = await this.reportRepo.findOne({
      where: { orderId },
      relations: ['uploader'],
    });

    if (!report) {
      return null;
    }

    // 验证权限
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order || (order.buyerId !== userId && order.sellerId !== userId)) {
      throw new ForbiddenError('无权查看此质检报告');
    }

    return report;
  }

  /**
   * 获取卖家上传的报告列表
   */
  async getBySeller(sellerId: string, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    const [items, total] = await this.reportRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.order', 'order')
      .where('report.uploadedBy = :sellerId', { sellerId })
      .orderBy('report.createdAt', 'DESC')
      .skip(offset)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items.map(r => ({
        id: r.id,
        reportNo: r.reportNo,
        orderNumber: r.order?.orderNumber,
        partNumber: r.partNumber,
        quantity: r.quantity,
        status: r.status,
        createdAt: r.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 审核质检报告（系统自动或管理员）
   */
  async reviewReport(
    reportId: string,
    status: 'passed' | 'failed',
    notes?: string
  ) {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['order'],
    });

    if (!report) {
      throw new NotFoundError('质检报告不存在');
    }

    report.status = status;
    report.reviewedAt = new Date();
    if (notes) report.reviewNotes = notes;

    await this.reportRepo.save(report);

    // 更新订单状态
    if (status === 'passed') {
      const order = report.order;
      order.status = 'shipped_to_buyer';
      await this.orderRepo.save(order);

      // 通知买家
      await messageService.sendOrderShippedMessage(order.buyerId, {
        orderNumber: order.orderNumber,
        carrier: '平台质检',
        trackingNumber: report.reportNo,
      });
    }

    return { success: true };
  }

  /**
   * 自动通过超过7天的待审核报告
   */
  async autoApproveOldReports() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const reports = await this.reportRepo.find({
      where: {
        status: 'pending',
        createdAt: LessThan(sevenDaysAgo),
      },
      relations: ['order'],
    });

    for (const report of reports) {
      await this.reviewReport(report.id, 'passed', '系统自动审核通过');
    }

    return reports.length;
  }
}

export const qualityService = new QualityService();
