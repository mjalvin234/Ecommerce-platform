import { AppDataSource } from '../config/database.js';
import { Message, MessageType, MessageCategory, getMessageCategory } from '../models/Message.js';
import { In } from 'typeorm';

export class MessageRepository {
  private repo = AppDataSource.getRepository(Message);

  /**
   * 根据ID查找消息
   */
  async findById(id: string): Promise<Message | null> {
    return this.repo.findOne({ where: { id } });
  }

  /**
   * 获取用户消息列表
   */
  async findByUserId(
    userId: string,
    options?: {
      type?: MessageType;
      category?: MessageCategory;
      read?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<[Message[], number]> {
    const queryBuilder = this.repo
      .createQueryBuilder('message')
      .where('message.userId = :userId', { userId })
      .orderBy('message.createdAt', 'DESC');

    // 按类型筛选
    if (options?.type) {
      queryBuilder.andWhere('message.type = :type', { type: options.type });
    }

    // 按分类筛选
    if (options?.category) {
      const types = this.getTypesByCategory(options.category);
      queryBuilder.andWhere('message.type IN (:...types)', { types });
    }

    // 按已读状态筛选
    if (options?.read !== undefined) {
      queryBuilder.andWhere('message.read = :read', { read: options.read });
    }

    // 分页
    if (options?.limit) {
      queryBuilder.take(options.limit);
    }
    if (options?.offset) {
      queryBuilder.skip(options.offset);
    }

    return queryBuilder.getManyAndCount();
  }

  /**
   * 获取未读消息数量
   */
  async getUnreadCount(userId: string): Promise<{ total: number; byCategory: Record<MessageCategory, number> }> {
    const messages = await this.repo.find({
      where: { userId, read: false },
      select: ['type'],
    });

    const byCategory: Record<MessageCategory, number> = {
      order: 0,
      negotiation: 0,
      system: 0,
    };

    let total = 0;
    for (const msg of messages) {
      total++;
      const category = getMessageCategory(msg.type);
      byCategory[category]++;
    }

    return { total, byCategory };
  }

  /**
   * 创建消息
   */
  async create(data: {
    userId: string;
    type: MessageType;
    title: string;
    content: string;
    relatedData?: Message['relatedData'];
  }): Promise<Message> {
    const message = this.repo.create({
      id: crypto.randomUUID(),
      ...data,
      read: false,
    });
    return this.repo.save(message);
  }

  /**
   * 批量创建消息（发送给多个用户）
   */
  async createBatch(
    users: Array<{ userId: string; data?: Message['relatedData'] }>,
    type: MessageType,
    title: string,
    content: string
  ): Promise<Message[]> {
    const messages = users.map(({ userId, data }) =>
      this.repo.create({
        id: crypto.randomUUID(),
        userId,
        type,
        title,
        content,
        relatedData: data,
        read: false,
      })
    );
    return this.repo.save(messages);
  }

  /**
   * 标记单条消息已读
   */
  async markAsRead(id: string, userId: string): Promise<boolean> {
    const result = await this.repo.update(
      { id, userId },
      { read: true }
    );
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * 标记全部已读
   */
  async markAllAsRead(
    userId: string,
    options?: { type?: MessageType; category?: MessageCategory }
  ): Promise<number> {
    const queryBuilder = this.repo
      .createQueryBuilder()
      .update(Message)
      .set({ read: true })
      .where('userId = :userId', { userId })
      .andWhere('read = :read', { read: false });

    if (options?.type) {
      queryBuilder.andWhere('type = :type', { type: options.type });
    }

    if (options?.category) {
      const types = this.getTypesByCategory(options.category);
      queryBuilder.andWhere('type IN (:...types)', { types });
    }

    const result = await queryBuilder.execute();
    return result.affected || 0;
  }

  /**
   * 删除消息
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.repo.delete({ id, userId });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * 清理过期消息（超过指定天数）
   */
  async cleanOldMessages(days: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  /**
   * 根据分类获取消息类型列表
   */
  private getTypesByCategory(category: MessageCategory): MessageType[] {
    const typeMap: Record<MessageCategory, MessageType[]> = {
      order: ['order_created', 'order_paid', 'order_shipped', 'order_completed', 'order_cancelled'],
      negotiation: ['negotiation_received', 'negotiation_accepted', 'negotiation_rejected'],
      system: ['system_announcement', 'verification_result', 'credit_change'],
    };
    return typeMap[category];
  }
}

export const messageRepository = new MessageRepository();
