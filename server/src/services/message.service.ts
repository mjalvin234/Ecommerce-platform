import { messageRepository } from '../repositories/message.repository.js';
import { MessageType, Message } from '../models/Message.js';
import { notificationConfigService } from './notification-config.service.js';
import { emailService } from './email.service.js';

/**
 * 消息模板配置
 */
const MESSAGE_TEMPLATES: Record<MessageType, { title: string; contentTemplate: string }> = {
  // 订单消息
  order_created: {
    title: '订单创建成功',
    contentTemplate: '您的订单 {orderNumber} 已创建成功，请尽快完成支付。',
  },
  order_paid: {
    title: '订单已支付',
    contentTemplate: '订单 {orderNumber} 已支付成功，请尽快安排发货。',
  },
  order_shipped: {
    title: '订单已发货',
    contentTemplate: '您的订单 {orderNumber} 已发货，物流公司：{carrier}，运单号：{trackingNumber}。',
  },
  order_completed: {
    title: '交易完成',
    contentTemplate: '订单 {orderNumber} 已完成，感谢您的信任！',
  },
  order_cancelled: {
    title: '订单已取消',
    contentTemplate: '订单 {orderNumber} 已取消。',
  },
  order_refunded: {
    title: '订单已退款',
    contentTemplate: '您的订单 {orderNumber} 已退款，退款金额 ¥{amount}，退款原因：{reason}。',
  },
  qa_passed: {
    title: '质检通过',
    contentTemplate: '您的订单 {orderNumber}（{partNumber}）已通过质检，即将发货。',
  },
  qa_failed: {
    title: '质检失败',
    contentTemplate: '您的订单 {orderNumber}（{partNumber}）质检未通过，原因：{reason}。',
  },
  // 议价消息
  negotiation_received: {
    title: '收到议价申请',
    contentTemplate: '您收到一条关于 {partNumber} 的议价申请，报价 ¥{offerPrice}，数量 {quantity} 件。',
  },
  negotiation_accepted: {
    title: '议价已接受',
    contentTemplate: '卖家已接受您关于 {partNumber} 的议价申请，订单已生成，请尽快支付。',
  },
  negotiation_rejected: {
    title: '议价已拒绝',
    contentTemplate: '卖家拒绝了您关于 {partNumber} 的议价申请。',
  },
  // 系统消息
  system_announcement: {
    title: '系统公告',
    contentTemplate: '{content}',
  },
  verification_result: {
    title: '认证审核结果',
    contentTemplate: '您的企业认证审核{result}。',
  },
  credit_change: {
    title: '信用分变更',
    contentTemplate: '您的信用分已{change}，当前信用分：{score}。',
  },
};

/**
 * 替换模板变量
 */
function renderTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return variables[key] !== undefined ? String(variables[key]) : `{${key}}`;
  });
}

export class MessageService {
  /**
   * 发送订单创建消息（给买家）
   */
  async sendOrderCreatedMessage(
    buyerId: string,
    data: { orderNumber: string; partNumber: string; quantity: number; totalAmount: number }
  ): Promise<Message> {
    const template = MESSAGE_TEMPLATES.order_created;
    const message = messageRepository.create({
      userId: buyerId,
      type: 'order_created',
      title: template.title,
      content: renderTemplate(template.contentTemplate, data),
      relatedData: { orderNumber: data.orderNumber, partNumber: data.partNumber },
    });

    // 通知管理员
    this.sendAdminNotification('order_created', { ...data, amount: data.totalAmount, buyerId });

    return message;
  }

  /**
   * 发送订单支付消息（给卖家）
   */
  async sendOrderPaidMessage(
    sellerId: string,
    data: { orderNumber: string; partNumber: string; quantity: number; totalAmount: number }
  ): Promise<Message> {
    const template = MESSAGE_TEMPLATES.order_paid;
    const message = messageRepository.create({
      userId: sellerId,
      type: 'order_paid',
      title: template.title,
      content: renderTemplate(template.contentTemplate, data),
      relatedData: { orderNumber: data.orderNumber, partNumber: data.partNumber },
    });

    // 通知管理员
    this.sendAdminNotification('order_paid', { ...data, amount: data.totalAmount, sellerId });

    return message;
  }

  /**
   * 发送订单发货消息（给买家）
   */
  async sendOrderShippedMessage(
    buyerId: string,
    data: { orderNumber: string; carrier: string; trackingNumber: string }
  ): Promise<Message> {
    const template = MESSAGE_TEMPLATES.order_shipped;
    const message = messageRepository.create({
      userId: buyerId,
      type: 'order_shipped',
      title: template.title,
      content: renderTemplate(template.contentTemplate, data),
      relatedData: data,
    });

    // 通知管理员
    this.sendAdminNotification('order_shipped', data);

    return message;
  }

  /**
   * 发送订单完成消息（给双方）
   */
  async sendOrderCompletedMessage(
    buyerId: string,
    sellerId: string,
    data: { orderNumber: string; partNumber: string }
  ): Promise<Message[]> {
    const template = MESSAGE_TEMPLATES.order_completed;
    const content = renderTemplate(template.contentTemplate, data);

    return messageRepository.createBatch(
      [
        { userId: buyerId, data: { orderNumber: data.orderNumber } },
        { userId: sellerId, data: { orderNumber: data.orderNumber } },
      ],
      'order_completed',
      template.title,
      content
    );
  }

  /**
   * 发送订单取消消息（给双方）
   */
  async sendOrderCancelledMessage(
    buyerId: string,
    sellerId: string,
    data: { orderNumber: string; reason?: string }
  ): Promise<Message[]> {
    const template = MESSAGE_TEMPLATES.order_cancelled;
    let content = renderTemplate(template.contentTemplate, data);
    if (data.reason) {
      content += ` 原因：${data.reason}`;
    }

    return messageRepository.createBatch(
      [
        { userId: buyerId, data: { orderNumber: data.orderNumber } },
        { userId: sellerId, data: { orderNumber: data.orderNumber } },
      ],
      'order_cancelled',
      template.title,
      content
    );
  }

  /**
   * 发送退款消息（给买家）
   */
  async sendRefundMessage(
    buyerId: string,
    data: { orderNumber: string; amount: number; reason: string; refundNo?: string }
  ): Promise<Message> {
    const template = MESSAGE_TEMPLATES.order_refunded;
    return messageRepository.create({
      userId: buyerId,
      type: 'order_refunded',
      title: template.title,
      content: renderTemplate(template.contentTemplate, data),
      relatedData: { orderNumber: data.orderNumber, refundNo: data.refundNo },
    });
  }

  /**
   * 发送质检通过消息（给买家）
   */
  async sendQaPassedMessage(
    buyerId: string,
    data: { orderNumber: string; partNumber: string }
  ): Promise<Message> {
    const template = MESSAGE_TEMPLATES.qa_passed;
    return messageRepository.create({
      userId: buyerId,
      type: 'qa_passed',
      title: template.title,
      content: renderTemplate(template.contentTemplate, data),
      relatedData: { orderNumber: data.orderNumber, partNumber: data.partNumber },
    });
  }

  /**
   * 发送议价收到消息（给卖家）
   */
  async sendNegotiationReceivedMessage(
    sellerId: string,
    data: { negotiationId: string; partNumber: string; offerPrice: number; quantity: number }
  ): Promise<Message> {
    const template = MESSAGE_TEMPLATES.negotiation_received;
    const message = messageRepository.create({
      userId: sellerId,
      type: 'negotiation_received',
      title: template.title,
      content: renderTemplate(template.contentTemplate, data),
      relatedData: { negotiationId: data.negotiationId, partNumber: data.partNumber },
    });

    // 通知管理员
    this.sendAdminNotification('negotiation_received', { ...data, sellerId });

    return message;
  }

  /**
   * 发送议价接受消息（给买家）
   */
  async sendNegotiationAcceptedMessage(
    buyerId: string,
    data: { negotiationId: string; partNumber: string; orderNumber: string }
  ): Promise<Message> {
    const template = MESSAGE_TEMPLATES.negotiation_accepted;
    const message = messageRepository.create({
      userId: buyerId,
      type: 'negotiation_accepted',
      title: template.title,
      content: renderTemplate(template.contentTemplate, data),
      relatedData: { negotiationId: data.negotiationId, partNumber: data.partNumber, orderNumber: data.orderNumber },
    });

    // 通知管理员
    this.sendAdminNotification('negotiation_accepted', { ...data, buyerId });

    return message;
  }

  /**
   * 发送议价拒绝消息（给买家）
   */
  async sendNegotiationRejectedMessage(
    buyerId: string,
    data: { negotiationId: string; partNumber: string }
  ): Promise<Message> {
    const template = MESSAGE_TEMPLATES.negotiation_rejected;
    const message = messageRepository.create({
      userId: buyerId,
      type: 'negotiation_rejected',
      title: template.title,
      content: renderTemplate(template.contentTemplate, data),
      relatedData: { negotiationId: data.negotiationId, partNumber: data.partNumber },
    });

    // 通知管理员
    this.sendAdminNotification('negotiation_rejected', { ...data, buyerId });

    return message;
  }

  /**
   * 发送系统公告
   */
  async sendSystemAnnouncement(
    userIds: string[],
    title: string,
    content: string
  ): Promise<Message[]> {
    return messageRepository.createBatch(
      userIds.map((userId) => ({ userId })),
      'system_announcement',
      title,
      content
    );
  }

  // ============ 查询方法 ============

  /**
   * 获取用户消息列表
   */
  async getMessages(
    userId: string,
    options?: {
      type?: MessageType;
      category?: 'order' | 'negotiation' | 'system';
      limit?: number;
      offset?: number;
    }
  ) {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;
    const [items, total] = await messageRepository.findByUserId(userId, {
      type: options?.type,
      category: options?.category,
      limit,
      offset,
    });

    return {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取未读消息数量
   */
  async getUnreadCount(userId: string) {
    return messageRepository.getUnreadCount(userId);
  }

  /**
   * 标记消息已读
   */
  async markAsRead(messageId: string, userId: string) {
    return messageRepository.markAsRead(messageId, userId);
  }

  /**
   * 标记全部已读
   */
  async markAllAsRead(
    userId: string,
    options?: { type?: MessageType; category?: 'order' | 'negotiation' | 'system' }
  ) {
    const updatedCount = await messageRepository.markAllAsRead(userId, options);
    return { success: true, updatedCount };
  }

  // ============ 管理员通知 ============

  /**
   * 发送管理员通知（站内消息 + 邮件）
   * 在业务操作后调用此方法通知管理员
   */
  async sendAdminNotification(
    type: MessageType,
    data: Record<string, any>
  ): Promise<void> {
    try {
      // 检查是否需要通知管理员
      const [shouldMessage, shouldEmail] = await Promise.all([
        notificationConfigService.shouldSendAdminMessage(type),
        notificationConfigService.shouldSendAdminEmail(type),
      ]);

      if (!shouldMessage && !shouldEmail) {
        return;
      }

      const template = MESSAGE_TEMPLATES[type];
      if (!template) {
        console.warn(`未找到消息类型 ${type} 的模板`);
        return;
      }

      const title = `[管理员] ${template.title}`;
      const content = renderTemplate(template.contentTemplate, data);

      // 发送站内消息给管理员（如果启用）
      if (shouldMessage) {
        // 这里可以发送给特定的管理员用户
        // 暂时记录日志
        console.log(`📧 [管理员站内消息] ${title}: ${content}`);
      }

      // 发送邮件给管理员（如果启用）
      if (shouldEmail) {
        const adminEmails = await notificationConfigService.getActiveAdminEmails();
        if (adminEmails.length > 0) {
          // 获取邮件模版
          const emailTemplate = await notificationConfigService.getEmailTemplate(type);
          let subject = title;
          let body = content;

          if (emailTemplate) {
            subject = emailTemplate.adminSubject
              ? notificationConfigService.renderTemplate(emailTemplate.adminSubject, data)
              : title;
            body = emailTemplate.adminBody
              ? notificationConfigService.renderTemplate(emailTemplate.adminBody, data)
              : content;
          }

          // 发送邮件给所有管理员
          for (const email of adminEmails) {
            await emailService.sendNotification(email, subject, body);
          }
        }
      }
    } catch (error) {
      console.error('发送管理员通知失败:', error);
    }
  }

  /**
   * 发送质检失败消息（给买家）
   */
  async sendQaFailedMessage(
    buyerId: string,
    data: { orderNumber: string; partNumber: string; reason: string }
  ): Promise<Message> {
    const template = MESSAGE_TEMPLATES.qa_failed;
    const message = messageRepository.create({
      userId: buyerId,
      type: 'qa_failed',
      title: template.title,
      content: renderTemplate(template.contentTemplate, data),
      relatedData: { orderNumber: data.orderNumber, partNumber: data.partNumber },
    });

    // 同时通知管理员
    this.sendAdminNotification('qa_failed', data);

    return message;
  }
}

export const messageService = new MessageService();
