import { AppDataSource } from '../config/database.js';
import { CreditScoreLog, CreditChangeType } from '../models/CreditScore.js';
import { User } from '../models/User.js';
import { Between } from 'typeorm';

// 信用分配置
const CREDIT_SCORE_CONFIG: Record<CreditChangeType, number> = {
  order_completed: 5,           // 订单完成 +5
  order_cancelled: -3,          // 订单取消 -3
  payment_on_time: 3,           // 按时付款 +3
  payment_delayed: -5,          // 延迟付款 -5
  quality_good: 5,              // 质量好评 +5
  quality_bad: -8,              // 质量差评 -8
  dispute_lost: -10,            // 纠纷败诉 -10
  admin_adjustment: 0,          // 管理员调整（动态值）
  certification_verified: 10,   // 企业认证通过 +10
};

// 信用分范围
const MIN_CREDIT_SCORE = 0;
const MAX_CREDIT_SCORE = 100;
const DEFAULT_CREDIT_SCORE = 60;

// 信用等级
export type CreditLevel = 'excellent' | 'good' | 'normal' | 'poor' | 'very_poor';

export function getCreditLevel(score: number): { level: CreditLevel; label: string } {
  if (score >= 90) return { level: 'excellent', label: '优秀' };
  if (score >= 75) return { level: 'good', label: '良好' };
  if (score >= 60) return { level: 'normal', label: '正常' };
  if (score >= 40) return { level: 'poor', label: '较差' };
  return { level: 'very_poor', label: '很差' };
}

export class CreditService {
  private creditLogRepo = AppDataSource.getRepository(CreditScoreLog);
  private userRepo = AppDataSource.getRepository(User);

  /**
   * 更新用户信用分
   */
  async updateCreditScore(data: {
    userId: string;
    changeType: CreditChangeType;
    relatedId?: string;
    remark?: string;
    customAmount?: number; // 用于管理员调整
  }) {
    const { userId, changeType, relatedId, remark, customAmount } = data;

    // 获取用户当前分数
    let user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    // 初始化信用分
    if (user.creditScore === null || user.creditScore === undefined) {
      user.creditScore = DEFAULT_CREDIT_SCORE;
    }

    // 计算变动分数
    let changeAmount = changeType === 'admin_adjustment'
      ? (customAmount || 0)
      : CREDIT_SCORE_CONFIG[changeType];

    const scoreBefore = user.creditScore;
    let scoreAfter = Math.max(MIN_CREDIT_SCORE, Math.min(MAX_CREDIT_SCORE, scoreBefore + changeAmount));

    // 确保变动后分数在合理范围
    changeAmount = scoreAfter - scoreBefore;

    // 创建日志记录
    const log = this.creditLogRepo.create({
      userId,
      changeType,
      changeAmount,
      scoreBefore,
      scoreAfter,
      relatedId,
      remark,
    });

    await this.creditLogRepo.save(log);

    // 更新用户分数
    user.creditScore = scoreAfter;
    await this.userRepo.save(user);

    return {
      scoreBefore,
      scoreAfter,
      changeAmount,
      log,
    };
  }

  /**
   * 获取用户信用分历史
   */
  async getCreditHistory(userId: string, options: {
    page?: number;
    pageSize?: number;
  } = {}) {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    const [logs, total] = await this.creditLogRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: pageSize,
    });

    return {
      items: logs.map(l => ({
        id: l.id,
        changeType: l.changeType,
        changeAmount: l.changeAmount,
        scoreBefore: l.scoreBefore,
        scoreAfter: l.scoreAfter,
        relatedId: l.relatedId,
        remark: l.remark,
        createdAt: l.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取用户信用信息
   */
  async getUserCreditInfo(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return null;

    const score = user.creditScore ?? DEFAULT_CREDIT_SCORE;
    const { level, label } = getCreditLevel(score);

    // 获取最近30天变动
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentLogs = await this.creditLogRepo.find({
      where: {
        userId,
        createdAt: Between(thirtyDaysAgo, new Date()),
      },
    });

    const recentChange = recentLogs.reduce((sum, log) => sum + log.changeAmount, 0);
    const positiveCount = recentLogs.filter(l => l.changeAmount > 0).length;
    const negativeCount = recentLogs.filter(l => l.changeAmount < 0).length;

    return {
      score,
      level,
      levelLabel: label,
      recentChange,
      positiveCount,
      negativeCount,
    };
  }

  /**
   * 批量获取用户信用等级
   */
  async batchGetCreditLevel(userIds: string[]): Promise<Record<string, { score: number; level: CreditLevel; label: string }>> {
    const users = await this.userRepo.find({
      where: userIds.map(id => ({ id })),
      select: ['id', 'creditScore'],
    });

    const result: Record<string, { score: number; level: CreditLevel; label: string }> = {};
    users.forEach(u => {
      const score = u.creditScore ?? DEFAULT_CREDIT_SCORE;
      const { level, label } = getCreditLevel(score);
      result[u.id] = { score, level, label };
    });

    return result;
  }

  /**
   * 处理订单完成事件
   */
  async onOrderCompleted(orderId: string, buyerId: string, sellerId: string) {
    // 买卖双方都加分
    await this.updateCreditScore({
      userId: buyerId,
      changeType: 'order_completed',
      relatedId: orderId,
      remark: '订单完成',
    });

    await this.updateCreditScore({
      userId: sellerId,
      changeType: 'order_completed',
      relatedId: orderId,
      remark: '订单完成',
    });
  }

  /**
   * 处理订单取消事件
   */
  async onOrderCancelled(orderId: string, cancelledBy: string, otherParty: string) {
    // 取消方减分
    await this.updateCreditScore({
      userId: cancelledBy,
      changeType: 'order_cancelled',
      relatedId: orderId,
      remark: '取消订单',
    });
  }

  /**
   * 处理企业认证通过
   */
  async onCertificationVerified(userId: string, certId: string) {
    await this.updateCreditScore({
      userId,
      changeType: 'certification_verified',
      relatedId: certId,
      remark: '企业认证通过',
    });
  }

  /**
   * 管理员调整信用分
   */
  async adminAdjust(userId: string, amount: number, adminId: string, reason: string) {
    return this.updateCreditScore({
      userId,
      changeType: 'admin_adjustment',
      customAmount: amount,
      remark: `管理员调整: ${reason} (操作人ID: ${adminId})`,
    });
  }
}

export const creditService = new CreditService();
