import { notificationConfigRepository } from '../repositories/notification-config.repository.js';
import {
  NotificationNode,
  NotificationCategory,
} from '../models/NotificationNode.js';
import { AdminEmail } from '../models/AdminEmail.js';
import { EmailTemplate } from '../models/EmailTemplate.js';

/**
 * 通知配置服务
 *
 * 提供通知节点、管理员邮箱、邮件模版的管理功能
 */
export class NotificationConfigService {
  /**
   * 获取所有通知节点
   */
  async getNotificationNodes(): Promise<NotificationNode[]> {
    return notificationConfigRepository.getAllNodes();
  }

  /**
   * 按分类获取通知节点
   */
  async getNodesByCategory(category: NotificationCategory): Promise<NotificationNode[]> {
    return notificationConfigRepository.getNodesByCategory(category);
  }

  /**
   * 更新通知节点配置
   */
  async updateNotificationNode(
    code: string,
    data: {
      adminMessageEnabled?: boolean;
      adminEmailEnabled?: boolean;
      userNotificationEnabled?: boolean;
    }
  ): Promise<NotificationNode | null> {
    return notificationConfigRepository.updateNode(code, data);
  }

  /**
   * 检查节点是否需要发送管理员消息
   */
  async shouldSendAdminMessage(code: string): Promise<boolean> {
    const node = await notificationConfigRepository.getNodeByCode(code);
    return node?.adminMessageEnabled ?? false;
  }

  /**
   * 检查节点是否需要发送管理员邮件
   */
  async shouldSendAdminEmail(code: string): Promise<boolean> {
    const node = await notificationConfigRepository.getNodeByCode(code);
    return node?.adminEmailEnabled ?? false;
  }

  /**
   * 检查节点是否需要通知用户
   */
  async shouldNotifyUser(code: string): Promise<boolean> {
    const node = await notificationConfigRepository.getNodeByCode(code);
    return node?.userNotificationEnabled ?? true;
  }

  // ============ 管理员邮箱 ============

  /**
   * 获取所有管理员邮箱
   */
  async getAdminEmails(): Promise<AdminEmail[]> {
    return notificationConfigRepository.getAllAdminEmails();
  }

  /**
   * 获取活跃的管理员邮箱列表（用于发送邮件）
   */
  async getActiveAdminEmails(): Promise<string[]> {
    const emails = await notificationConfigRepository.getActiveAdminEmails();
    return emails.map((e) => e.email);
  }

  /**
   * 添加管理员邮箱
   */
  async addAdminEmail(email: string, name?: string): Promise<AdminEmail> {
    return notificationConfigRepository.addAdminEmail(email, name);
  }

  /**
   * 更新管理员邮箱
   */
  async updateAdminEmail(
    id: string,
    data: { name?: string; active?: boolean; verified?: boolean }
  ): Promise<AdminEmail | null> {
    return notificationConfigRepository.updateAdminEmail(id, data);
  }

  /**
   * 设为主邮箱
   */
  async setPrimaryEmail(id: string): Promise<boolean> {
    return notificationConfigRepository.setPrimaryEmail(id);
  }

  /**
   * 删除管理员邮箱
   */
  async deleteAdminEmail(id: string): Promise<boolean> {
    return notificationConfigRepository.deleteAdminEmail(id);
  }

  // ============ 邮件模版 ============

  /**
   * 获取所有邮件模版
   */
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return notificationConfigRepository.getAllTemplates();
  }

  /**
   * 获取邮件模版
   */
  async getEmailTemplate(code: string): Promise<EmailTemplate | null> {
    return notificationConfigRepository.getTemplateByCode(code);
  }

  /**
   * 更新邮件模版
   */
  async updateEmailTemplate(
    code: string,
    data: {
      subject?: string;
      body?: string;
      adminSubject?: string;
      adminBody?: string;
    }
  ): Promise<EmailTemplate | null> {
    return notificationConfigRepository.updateTemplate(code, data);
  }

  /**
   * 渲染邮件模版
   */
  renderTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      return variables[key] !== undefined ? String(variables[key]) : `{${key}}`;
    });
  }

  /**
   * 初始化默认数据
   */
  async initializeDefaults(): Promise<void> {
    return notificationConfigRepository.initializeDefaults();
  }
}

export const notificationConfigService = new NotificationConfigService();
