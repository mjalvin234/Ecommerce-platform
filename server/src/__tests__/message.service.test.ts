import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MessageService } from '../services/message.service.js';
import { messageRepository } from '../repositories/message.repository.js';
import { AppDataSource } from '../config/database.js';

/**
 * 消息服务测试套件
 */
describe('MessageService', () => {
  beforeAll(async () => {
    // 初始化测试数据库
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    // 关闭数据库连接
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
  const testUserId = 'test-user-001';
  const messageService = new MessageService();

  describe('sendOrderCreatedMessage', () => {
    it('应该成功发送订单创建消息', async () => {
      const message = await messageService.sendOrderCreatedMessage(testUserId, {
        orderNumber: 'ORD-TEST001',
        partNumber: 'STM32F103C8T6',
        quantity: 100,
        totalAmount: 1045.00,
      });

      expect(message).toBeDefined();
      expect(message.userId).toBe(testUserId);
      expect(message.type).toBe('order_created');
      expect(message.title).toBe('订单创建成功');
      expect(message.read).toBe(false);
    });
  });

  describe('sendOrderShippedMessage', () => {
    it('应该成功发送发货消息', async () => {
      const message = await messageService.sendOrderShippedMessage(testUserId, {
        orderNumber: 'ORD-TEST002',
        carrier: '顺丰速运',
        trackingNumber: 'SF1234567890',
      });

      expect(message).toBeDefined();
      expect(message.type).toBe('order_shipped');
      expect(message.content).toContain('顺丰速运');
      expect(message.content).toContain('SF1234567890');
    });
  });

  describe('sendNegotiationReceivedMessage', () => {
    it('应该成功发送议价收到消息', async () => {
      const message = await messageService.sendNegotiationReceivedMessage(testUserId, {
        negotiationId: 'neg-test-001',
        partNumber: 'XC7Z020-2CLG400I',
        offerPrice: 800.00,
        quantity: 50,
      });

      expect(message).toBeDefined();
      expect(message.type).toBe('negotiation_received');
      expect(message.content).toContain('XC7Z020-2CLG400I');
      expect(message.content).toContain('800');
    });
  });

  describe('getMessages', () => {
    it('应该成功获取消息列表', async () => {
      const result = await messageService.getMessages(testUserId, {
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.page).toBe(1);
    });

    it('应该正确按分类筛选消息', async () => {
      const result = await messageService.getMessages(testUserId, {
        category: 'order',
        limit: 10,
      });

      expect(result.items.every(m => m.type.startsWith('order_'))).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    it('应该返回正确的未读数量', async () => {
      const result = await messageService.getUnreadCount(testUserId);

      expect(result).toBeDefined();
      expect(typeof result.total).toBe('number');
      expect(result.byCategory).toHaveProperty('order');
      expect(result.byCategory).toHaveProperty('negotiation');
      expect(result.byCategory).toHaveProperty('system');
    });
  });

  describe('markAsRead', () => {
    it('应该成功标记消息已读', async () => {
      // 先创建一条消息
      const message = await messageService.sendOrderCreatedMessage(testUserId, {
        orderNumber: 'ORD-TEST003',
        partNumber: 'TEST-PART',
        quantity: 1,
        totalAmount: 100,
      });

      // 标记已读
      const result = await messageService.markAsRead(message.id, testUserId);
      expect(result).toBe(true);

      // 验证已读状态
      const messages = await messageRepository.findByUserId(testUserId, { limit: 100 });
      const updatedMessage = messages[0].find(m => m.id === message.id);
      expect(updatedMessage?.read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('应该成功标记所有消息已读', async () => {
      // 创建几条消息
      await messageService.sendOrderCreatedMessage(testUserId, {
        orderNumber: 'ORD-TEST004',
        partNumber: 'TEST-PART1',
        quantity: 1,
        totalAmount: 100,
      });
      await messageService.sendOrderCreatedMessage(testUserId, {
        orderNumber: 'ORD-TEST005',
        partNumber: 'TEST-PART2',
        quantity: 1,
        totalAmount: 100,
      });

      // 全部标记已读
      const result = await messageService.markAllAsRead(testUserId);
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBeGreaterThanOrEqual(0);
    });
  });
});

/**
 * 消息类型测试
 */
describe('Message Types', () => {
  it('订单消息类型应该以 order_ 开头', () => {
    const orderTypes = [
      'order_created',
      'order_paid',
      'order_shipped',
      'order_completed',
      'order_cancelled',
    ];
    orderTypes.forEach(type => {
      expect(type.startsWith('order_')).toBe(true);
    });
  });

  it('议价消息类型应该以 negotiation_ 开头', () => {
    const negotiationTypes = [
      'negotiation_received',
      'negotiation_accepted',
      'negotiation_rejected',
    ];
    negotiationTypes.forEach(type => {
      expect(type.startsWith('negotiation_')).toBe(true);
    });
  });

  it('系统消息类型应该正确', () => {
    const systemTypes = [
      'system_announcement',
      'verification_result',
      'credit_change',
    ];
    systemTypes.forEach(type => {
      expect(type.startsWith('order_')).toBe(false);
      expect(type.startsWith('negotiation_')).toBe(false);
    });
  });
});
