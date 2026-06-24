import { AppDataSource } from '../config/database.js';
import {
  NotificationNode,
  DEFAULT_NOTIFICATION_NODES,
  NotificationCategory,
} from '../models/NotificationNode.js';
import { AdminEmail } from '../models/AdminEmail.js';
import { EmailTemplate, DEFAULT_EMAIL_TEMPLATES } from '../models/EmailTemplate.js';
import { In, Not } from 'typeorm';

/**
 * 通知配置仓库
 *
 * 管理通知节点、管理员邮箱、邮件模版
 */
export class NotificationConfigRepository {
  private nodeRepo = AppDataSource.getRepository(NotificationNode);
  private emailRepo = AppDataSource.getRepository(AdminEmail);
  private templateRepo = AppDataSource.getRepository(EmailTemplate);

  // ============ 通知节点 ============

  /**
   * 获取所有通知节点
   */
  async getAllNodes(): Promise<NotificationNode[]> {
    return this.nodeRepo.find({
      order: { category: 'ASC', code: 'ASC' },
    });
  }

  /**
   * 按分类获取通知节点
   */
  async getNodesByCategory(category: NotificationCategory): Promise<NotificationNode[]> {
    return this.nodeRepo.find({
      where: { category },
      order: { code: 'ASC' },
    });
  }

  /**
   * 按代码获取通知节点
   */
  async getNodeByCode(code: string): Promise<NotificationNode | null> {
    return this.nodeRepo.findOne({ where: { code } });
  }

  /**
   * 更新通知节点配置
   */
  async updateNode(
    code: string,
    data: {
      adminMessageEnabled?: boolean;
      adminEmailEnabled?: boolean;
      userNotificationEnabled?: boolean;
    }
  ): Promise<NotificationNode | null> {
    const node = await this.nodeRepo.findOne({ where: { code } });
    if (!node) return null;

    Object.assign(node, data);
    return this.nodeRepo.save(node);
  }

  /**
   * 初始化默认通知节点
   */
  async initializeDefaultNodes(): Promise<void> {
    const existingCount = await this.nodeRepo.count();
    if (existingCount > 0) return;

    const nodes = DEFAULT_NOTIFICATION_NODES.map((node) =>
      this.nodeRepo.create({
        id: crypto.randomUUID(),
        ...node,
      })
    );
    await this.nodeRepo.save(nodes);
    console.log(`📧 已初始化 ${nodes.length} 个通知节点`);
  }

  // ============ 管理员邮箱 ============

  /**
   * 获取所有管理员邮箱
   */
  async getAllAdminEmails(): Promise<AdminEmail[]> {
    return this.emailRepo.find({
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  /**
   * 获取活跃的管理员邮箱
   */
  async getActiveAdminEmails(): Promise<AdminEmail[]> {
    return this.emailRepo.find({
      where: { active: true },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  /**
   * 获取主邮箱
   */
  async getPrimaryEmail(): Promise<AdminEmail | null> {
    return this.emailRepo.findOne({
      where: { isPrimary: true, active: true },
    });
  }

  /**
   * 添加管理员邮箱
   */
  async addAdminEmail(email: string, name?: string): Promise<AdminEmail> {
    // 检查是否已存在
    const existing = await this.emailRepo.findOne({ where: { email } });
    if (existing) {
      if (!existing.active) {
        existing.active = true;
        existing.name = name || existing.name;
        return this.emailRepo.save(existing);
      }
      throw new Error('该邮箱已存在');
    }

    // 检查是否是第一个邮箱（自动设为主邮箱）
    const count = await this.emailRepo.count({ where: { active: true } });

    const adminEmail = this.emailRepo.create({
      id: crypto.randomUUID(),
      email,
      name: name || '',
      isPrimary: count === 0,
      verified: false,
      active: true,
    });

    return this.emailRepo.save(adminEmail);
  }

  /**
   * 更新管理员邮箱
   */
  async updateAdminEmail(
    id: string,
    data: { name?: string; active?: boolean; verified?: boolean }
  ): Promise<AdminEmail | null> {
    const email = await this.emailRepo.findOne({ where: { id } });
    if (!email) return null;

    Object.assign(email, data);
    return this.emailRepo.save(email);
  }

  /**
   * 设为主邮箱
   */
  async setPrimaryEmail(id: string): Promise<boolean> {
    const email = await this.emailRepo.findOne({ where: { id, active: true } });
    if (!email) return false;

    // 取消其他主邮箱
    await this.emailRepo.update(
      { isPrimary: true },
      { isPrimary: false }
    );

    // 设置新的主邮箱
    email.isPrimary = true;
    await this.emailRepo.save(email);
    return true;
  }

  /**
   * 删除管理员邮箱
   */
  async deleteAdminEmail(id: string): Promise<boolean> {
    const result = await this.emailRepo.delete({ id });
    return result.affected ? result.affected > 0 : false;
  }

  // ============ 邮件模版 ============

  /**
   * 获取所有邮件模版
   */
  async getAllTemplates(): Promise<EmailTemplate[]> {
    return this.templateRepo.find({
      order: { code: 'ASC' },
    });
  }

  /**
   * 按代码获取邮件模版
   */
  async getTemplateByCode(code: string): Promise<EmailTemplate | null> {
    return this.templateRepo.findOne({ where: { code } });
  }

  /**
   * 更新邮件模版
   */
  async updateTemplate(
    code: string,
    data: {
      subject?: string;
      body?: string;
      adminSubject?: string;
      adminBody?: string;
    }
  ): Promise<EmailTemplate | null> {
    const template = await this.templateRepo.findOne({ where: { code } });
    if (!template) return null;

    Object.assign(template, data);
    return this.templateRepo.save(template);
  }

  /**
   * 初始化默认邮件模版
   */
  async initializeDefaultTemplates(): Promise<void> {
    const existingCount = await this.templateRepo.count();
    if (existingCount > 0) return;

    const templates = DEFAULT_EMAIL_TEMPLATES.map((template) =>
      this.templateRepo.create({
        id: crypto.randomUUID(),
        ...template,
      })
    );
    await this.templateRepo.save(templates);
    console.log(`📧 已初始化 ${templates.length} 个邮件模版`);
  }

  /**
   * 初始化所有默认数据
   */
  async initializeDefaults(): Promise<void> {
    await this.initializeDefaultNodes();
    await this.initializeDefaultTemplates();
  }
}

export const notificationConfigRepository = new NotificationConfigRepository();
