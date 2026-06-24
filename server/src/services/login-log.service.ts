import { AppDataSource } from '../config/database.js';
import { LoginLog } from '../models/LoginLog.js';

/**
 * 解析User-Agent
 */
function parseUserAgent(userAgent: string): {
  deviceType: string;
  os: string;
  browser: string;
} {
  const ua = userAgent.toLowerCase();

  // 设备类型
  let deviceType = 'desktop';
  if (/mobile|android|iphone/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = 'tablet';
  }

  // 操作系统
  let os = 'Unknown';
  if (/windows/i.test(ua)) {
    os = 'Windows';
  } else if (/mac/i.test(ua)) {
    os = 'macOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/iphone|ipad/i.test(ua)) {
    os = 'iOS';
  }

  // 浏览器
  let browser = 'Unknown';
  if (/edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/chrome/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox/i.test(ua)) {
    browser = 'Firefox';
  } else if (/msie|trident/i.test(ua)) {
    browser = 'IE';
  }

  return { deviceType, os, browser };
}

/**
 * 登录日志服务
 */
export class LoginLogService {
  private repo = AppDataSource.getRepository(LoginLog);

  /**
   * 记录登录日志
   */
  async logLogin(params: {
    userId: string;
    ipAddress: string;
    userAgent: string;
    status: 'success' | 'failed';
    failReason?: string;
  }): Promise<LoginLog> {
    const { deviceType, os, browser } = parseUserAgent(params.userAgent);

    const log = this.repo.create({
      userId: params.userId,
      loginTime: new Date(),
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      deviceType,
      os,
      browser,
      loginStatus: params.status,
      failReason: params.failReason,
    });

    return this.repo.save(log);
  }

  /**
   * 获取用户登录历史
   */
  async getUserLoginHistory(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<[LoginLog[], number]> {
    const queryBuilder = this.repo
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .orderBy('log.loginTime', 'DESC');

    if (options?.limit) {
      queryBuilder.take(options.limit);
    }
    if (options?.offset) {
      queryBuilder.skip(options.offset);
    }

    return queryBuilder.getManyAndCount();
  }

  /**
   * 获取最近登录记录
   */
  async getRecentLogins(userId: string, count: number = 5): Promise<LoginLog[]> {
    return this.repo.find({
      where: { userId },
      order: { loginTime: 'DESC' },
      take: count,
    });
  }

  /**
   * 检测异常登录
   * 返回是否为新设备或新地点登录
   */
  async detectAnomalousLogin(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ isAnomalous: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    // 获取最近的登录记录
    const recentLogins = await this.getRecentLogins(userId, 10);

    if (recentLogins.length === 0) {
      // 首次登录不算异常
      return { isAnomalous: false, reasons: [] };
    }

    const { deviceType, os, browser } = parseUserAgent(userAgent);

    // 检查设备类型
    const knownDeviceTypes = new Set(recentLogins.map(l => l.deviceType));
    if (!knownDeviceTypes.has(deviceType)) {
      reasons.push(`新设备类型: ${deviceType}`);
    }

    // 检查操作系统
    const knownOS = new Set(recentLogins.map(l => l.os));
    if (!knownOS.has(os)) {
      reasons.push(`新操作系统: ${os}`);
    }

    // 检查IP地址
    const knownIPs = new Set(recentLogins.map(l => l.ipAddress));
    if (!knownIPs.has(ipAddress)) {
      reasons.push('新的登录地点');
    }

    return {
      isAnomalous: reasons.length > 0,
      reasons,
    };
  }

  /**
   * 获取登录统计
   */
  async getLoginStats(userId: string): Promise<{
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    lastLoginTime: Date | null;
    lastLoginIP: string | null;
  }> {
    const logs = await this.repo.find({ where: { userId } });

    const successfulLogins = logs.filter(l => l.loginStatus === 'success').length;
    const failedLogins = logs.filter(l => l.loginStatus === 'failed').length;

    const lastSuccessLogin = logs
      .filter(l => l.loginStatus === 'success')
      .sort((a, b) => b.loginTime.getTime() - a.loginTime.getTime())[0];

    return {
      totalLogins: logs.length,
      successfulLogins,
      failedLogins,
      lastLoginTime: lastSuccessLogin?.loginTime || null,
      lastLoginIP: lastSuccessLogin?.ipAddress || null,
    };
  }

  /**
   * 清理过期日志（保留最近6个月）
   */
  async cleanOldLogs(): Promise<number> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('loginTime < :date', { date: sixMonthsAgo })
      .execute();

    return result.affected || 0;
  }
}

export const loginLogService = new LoginLogService();
