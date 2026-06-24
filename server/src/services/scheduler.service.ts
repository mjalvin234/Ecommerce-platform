import { AppDataSource } from '../config/database.js';
import { Order } from '../models/Order.js';
import { messageService } from './message.service.js';
import { alertService } from './alert.service.js';
import { paymentRecordRepository } from '../repositories/payment.repository.js';
import { LessThan } from 'typeorm';

/**
 * 定时任务服务
 */
export class SchedulerService {
  private orderRepo = AppDataSource.getRepository(Order);
  private intervals: NodeJS.Timeout[] = [];

  /**
   * 启动所有定时任务
   */
  start(): void {
    console.log('⏰ 启动定时任务...');

    // 每5分钟检查超时订单
    this.startOrderTimeoutCheck();

    // 每1分钟检查支付超时
    this.startPaymentTimeoutCheck();

    // 每30分钟清理过期消息
    this.startMessageCleanup();

    // 每小时检查库存预警
    this.startInventoryAlertCheck();

    // 每天清理已读预警
    this.startAlertCleanup();

    console.log('✅ 定时任务已启动');
  }

  /**
   * 停止所有定时任务
   */
  stop(): void {
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals = [];
    console.log('⏹️ 定时任务已停止');
  }

  /**
   * 订单超时检查
   * 每5分钟检查一次
   */
  private startOrderTimeoutCheck(): void {
    const checkExpiredOrders = async () => {
      try {
        const now = new Date();
        const timeoutDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24小时前

        // 查找超时的待支付订单
        const expiredOrders = await this.orderRepo.find({
          where: {
            status: 'awaiting_payment',
            createdAt: LessThan(timeoutDate),
          },
          relations: ['buyer', 'seller'],
        });

        for (const order of expiredOrders) {
          await this.cancelExpiredOrder(order);
        }

        if (expiredOrders.length > 0) {
          console.log(`🕐 已自动取消 ${expiredOrders.length} 个超时订单`);
        }
      } catch (err) {
        console.error('检查超时订单失败:', err);
      }
    };

    // 立即执行一次
    checkExpiredOrders();

    // 每5分钟执行一次
    const interval = setInterval(checkExpiredOrders, 5 * 60 * 1000);
    this.intervals.push(interval);
  }

  /**
   * 取消超时订单
   */
  private async cancelExpiredOrder(order: Order): Promise<void> {
    // 恢复库存
    if (order.inventoryId) {
      await AppDataSource.query(
        `UPDATE inventory SET available_qty = available_qty + ?, quantity = quantity + ? WHERE id = ?`,
        [order.quantity, order.quantity, order.inventoryId]
      );
    }

    // 更新订单状态
    order.status = 'cancelled';
    await this.orderRepo.save(order);

    // 发送通知
    if (order.buyerId && order.sellerId) {
      await messageService.sendOrderCancelledMessage(order.buyerId, order.sellerId, {
        orderNumber: order.orderNumber,
        reason: '订单超时未支付，已自动取消',
      });
    }
  }

  /**
   * 清理过期消息
   * 每30分钟执行一次
   */
  private startMessageCleanup(): void {
    const cleanupMessages = async () => {
      try {
        const result = await AppDataSource.query(
          `DELETE FROM messages WHERE created_at < datetime('now', '-90 days')`
        );
        if (result.changes > 0) {
          console.log(`🧹 已清理 ${result.changes} 条过期消息`);
        }
      } catch (err) {
        console.error('清理过期消息失败:', err);
      }
    };

    // 每30分钟执行一次
    const interval = setInterval(cleanupMessages, 30 * 60 * 1000);
    this.intervals.push(interval);
  }

  /**
   * 库存预警检查
   * 每小时执行一次
   */
  private startInventoryAlertCheck(): void {
    const checkAlerts = async () => {
      try {
        const alerts = await alertService.checkLowStockAlerts();
        if (alerts.length > 0) {
          console.log(`⚠️ 已生成 ${alerts.length} 条库存预警`);
        }
      } catch (err) {
        console.error('检查库存预警失败:', err);
      }
    };

    // 每1小时执行一次
    const interval = setInterval(checkAlerts, 60 * 60 * 1000);
    this.intervals.push(interval);
  }

  /**
   * 清理已读预警
   * 每天执行一次
   */
  private startAlertCleanup(): void {
    const cleanup = async () => {
      try {
        const count = await alertService.cleanupOldAlerts();
        if (count > 0) {
          console.log(`🧹 已清理 ${count} 条已读预警`);
        }
      } catch (err) {
        console.error('清理已读预警失败:', err);
      }
    };

    // 每24小时执行一次
    const interval = setInterval(cleanup, 24 * 60 * 60 * 1000);
    this.intervals.push(interval);
  }

  /**
   * 支付超时检查
   * 每1分钟检查一次
   * 自动关闭过期未支付的支付记录
   */
  private startPaymentTimeoutCheck(): void {
    const checkExpiredPayments = async () => {
      try {
        // 查找过期未支付的支付记录
        const expiredPayments = await paymentRecordRepository.findExpiredPending();

        for (const payment of expiredPayments) {
          await this.closeExpiredPayment(payment);
        }

        if (expiredPayments.length > 0) {
          console.log(`💳 已自动关闭 ${expiredPayments.length} 个过期支付记录`);
        }
      } catch (err) {
        console.error('检查过期支付失败:', err);
      }
    };

    // 立即执行一次
    checkExpiredPayments();

    // 每1分钟执行一次
    const interval = setInterval(checkExpiredPayments, 60 * 1000);
    this.intervals.push(interval);
  }

  /**
   * 关闭过期支付记录
   */
  private async closeExpiredPayment(payment: any): Promise<void> {
    try {
      // 更新支付状态为已关闭
      await paymentRecordRepository.updateStatus(payment.paymentNo, 'closed', {
        closedAt: new Date(),
      });

      // 检查关联订单是否还在待支付状态
      const order = await this.orderRepo.findOne({
        where: { id: payment.orderId },
      });

      if (order && order.status === 'awaiting_payment') {
        // 恢复库存
        if (order.inventoryId) {
          await AppDataSource.query(
            `UPDATE inventory SET available_qty = available_qty + ?, quantity = quantity + ? WHERE id = ?`,
            [order.quantity, order.quantity, order.inventoryId]
          );
        }

        // 更新订单状态为已取消
        order.status = 'cancelled';
        await this.orderRepo.save(order);

        // 发送通知给买家
        if (order.buyerId) {
          await messageService.sendOrderCancelledMessage(order.buyerId, order.sellerId, {
            orderNumber: order.orderNumber,
            reason: '支付超时，订单已自动取消',
          });
        }

        console.log(`[支付超时] 订单 ${order.orderNumber} 已自动取消`);
      }
    } catch (err) {
      console.error(`关闭过期支付失败: ${payment.paymentNo}`, err);
    }
  }
}

export const schedulerService = new SchedulerService();
