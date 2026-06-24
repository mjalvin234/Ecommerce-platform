import { AppDataSource } from '../config/database.js';
import { ApiKey, PLAN_CONFIG, ApiKeyPlan } from '../models/ApiKey.js';
import crypto from 'crypto';

const apiKeyRepo = () => AppDataSource.getRepository(ApiKey);

const KEY_PREFIX = 'tc_';  // Trading Center 前缀

export const apiKeyService = {
  /**
   * 生成API Key
   */
  generateKey(): string {
    return KEY_PREFIX + crypto.randomBytes(24).toString('hex');
  },

  /**
   * 生成Secret
   */
  generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  },

  /**
   * 申请API Key
   */
  async createApiKey(userId: string, name: string, plan: ApiKeyPlan = 'free'): Promise<ApiKey> {
    // 检查用户已有密钥数量
    const existing = await apiKeyRepo().count({ where: { userId, status: 'active' } });
    if (existing >= 5) {
      throw new Error('每个用户最多可创建5个活跃密钥');
    }

    const config = PLAN_CONFIG[plan];
    const apiKey = apiKeyRepo().create({
      userId,
      name,
      key: this.generateKey(),
      secret: this.generateSecret(),
      plan,
      rateLimit: config.rateLimit,
      permissions: config.permissions,
      status: 'active', // 直接激活，实际可能需要审核
    });

    return await apiKeyRepo().save(apiKey);
  },

  /**
   * 获取用户的API Keys
   */
  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return await apiKeyRepo().find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  },

  /**
   * 获取API Key详情
   */
  async getApiKey(id: string, userId: string): Promise<ApiKey | null> {
    return await apiKeyRepo().findOne({ where: { id, userId } });
  },

  /**
   * 验证API Key
   */
  async validateKey(key: string): Promise<ApiKey | null> {
    const apiKey = await apiKeyRepo().findOne({ where: { key } });

    if (!apiKey) return null;
    if (apiKey.status !== 'active') return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    // 更新最后使用时间
    apiKey.lastUsedAt = new Date();
    await apiKeyRepo().save(apiKey);

    return apiKey;
  },

  /**
   * 检查权限
   */
  hasPermission(apiKey: ApiKey, permission: string): boolean {
    if (apiKey.permissions.includes('*')) return true;
    return apiKey.permissions.includes(permission);
  },

  /**
   * 更新API Key
   */
  async updateApiKey(id: string, userId: string, data: Partial<{ name: string; permissions: string[] }>): Promise<ApiKey> {
    const apiKey = await this.getApiKey(id, userId);
    if (!apiKey) {
      throw new Error('API Key不存在');
    }

    if (data.name) apiKey.name = data.name;
    if (data.permissions) apiKey.permissions = data.permissions;

    return await apiKeyRepo().save(apiKey);
  },

  /**
   * 重新生成Secret
   */
  async regenerateSecret(id: string, userId: string): Promise<ApiKey> {
    const apiKey = await this.getApiKey(id, userId);
    if (!apiKey) {
      throw new Error('API Key不存在');
    }

    apiKey.secret = this.generateSecret();
    return await apiKeyRepo().save(apiKey);
  },

  /**
   * 暂停/恢复API Key
   */
  async setApiKeyStatus(id: string, userId: string, status: 'active' | 'suspended'): Promise<ApiKey> {
    const apiKey = await this.getApiKey(id, userId);
    if (!apiKey) {
      throw new Error('API Key不存在');
    }

    apiKey.status = status;
    return await apiKeyRepo().save(apiKey);
  },

  /**
   * 删除API Key
   */
  async deleteApiKey(id: string, userId: string): Promise<void> {
    const apiKey = await this.getApiKey(id, userId);
    if (!apiKey) {
      throw new Error('API Key不存在');
    }

    await apiKeyRepo().remove(apiKey);
  },

  /**
   * 升级套餐
   */
  async upgradePlan(id: string, userId: string, plan: ApiKeyPlan): Promise<ApiKey> {
    const apiKey = await this.getApiKey(id, userId);
    if (!apiKey) {
      throw new Error('API Key不存在');
    }

    const config = PLAN_CONFIG[plan];
    apiKey.plan = plan;
    apiKey.rateLimit = config.rateLimit;
    apiKey.permissions = config.permissions;

    return await apiKeyRepo().save(apiKey);
  },

  /**
   * 获取使用统计
   */
  async getUsageStats(id: string, userId: string): Promise<{
    todayCount: number;
    monthCount: number;
    limitPerDay: number;
  }> {
    const apiKey = await this.getApiKey(id, userId);
    if (!apiKey) {
      throw new Error('API Key不存在');
    }

    // 这里应该从Redis或日志表统计，暂时返回模拟数据
    const config = PLAN_CONFIG[apiKey.plan];
    return {
      todayCount: 0,
      monthCount: 0,
      limitPerDay: config.dailyLimit
    };
  }
};
