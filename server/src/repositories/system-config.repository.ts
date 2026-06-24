import { AppDataSource } from '../config/database.js';
import { SystemConfig } from '../models/SystemConfig.js';

/**
 * 系统配置仓库
 */
export const systemConfigRepository = {
  /**
   * 获取系统配置（单例模式）
   * 如果不存在则创建默认配置
   */
  async getConfig(): Promise<SystemConfig> {
    const repo = AppDataSource.getRepository(SystemConfig);
    let config = await repo.findOne({ where: {} as any });

    if (!config) {
      // 创建默认配置
      config = repo.create({
        siteName: '芯核交易中心',
        siteDescription: '专业的电子元器件交易平台',
        contactEmail: 'support@coretrading.com',
        contactPhone: '400-888-8888',
        address: '广东省深圳市龙岗区平湖街道XX物流园3区',
        companyName: '深圳芯核科技有限公司',
      });
      await repo.save(config);
    }

    return config;
  },

  /**
   * 更新系统配置
   */
  async updateConfig(data: Partial<SystemConfig>): Promise<SystemConfig> {
    const repo = AppDataSource.getRepository(SystemConfig);
    let config = await this.getConfig();

    // 更新字段
    Object.assign(config, data);

    return repo.save(config);
  },

  /**
   * 重置为默认配置
   */
  async resetToDefault(): Promise<SystemConfig> {
    const repo = AppDataSource.getRepository(SystemConfig);
    const config = await this.getConfig();

    // 重置为默认值
    repo.merge(config, {
      siteName: '芯核交易中心',
      siteDescription: '专业的电子元器件交易平台',
      contactEmail: 'support@coretrading.com',
      contactPhone: '400-888-8888',
      address: '广东省深圳市龙岗区平湖街道XX物流园3区',
      companyName: '深圳芯核科技有限公司',
      enableRegistration: true,
      enableEmailVerification: true,
      enableSmsVerification: false,
      maxLoginAttempts: 5,
      sessionTimeout: 30,
      minPasswordLength: 8,
      requirePasswordUppercase: true,
      requirePasswordNumber: true,
      requirePasswordSpecial: false,
    });

    return repo.save(config);
  },
};
