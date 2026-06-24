import { AppDataSource } from '../config/database.js';
import { Follow } from '../models/Follow.js';
import { User } from '../models/User.js';
import { Inventory } from '../models/Inventory.js';
import { In } from 'typeorm';

export class FollowService {
  private followRepo = AppDataSource.getRepository(Follow);
  private userRepo = AppDataSource.getRepository(User);

  /**
   * 关注用户
   */
  async followUser(followerId: string, followingId: string) {
    // 不能关注自己
    if (followerId === followingId) {
      throw new Error('不能关注自己');
    }

    // 检查被关注用户是否存在
    const targetUser = await this.userRepo.findOne({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new Error('用户不存在');
    }

    // 检查是否已关注
    const existing = await this.followRepo.findOne({
      where: { followerId, followingId },
    });

    if (existing) {
      return existing;
    }

    // 创建关注关系
    const follow = this.followRepo.create({
      followerId,
      followingId,
    });

    return this.followRepo.save(follow);
  }

  /**
   * 取消关注
   */
  async unfollowUser(followerId: string, followingId: string) {
    const result = await this.followRepo.delete({ followerId, followingId });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * 获取用户关注列表（我关注的人）
   */
  async getFollowing(userId: string, options: {
    page?: number;
    pageSize?: number;
  } = {}) {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    const [follows, total] = await this.followRepo.findAndCount({
      where: { followerId: userId },
      relations: ['following'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: pageSize,
    });

    return {
      items: follows.map(f => ({
        id: f.id,
        user: f.following ? {
          id: f.following.id,
          companyName: f.following.companyName,
          role: f.following.role,
          verificationStatus: f.following.verificationStatus,
          creditScore: f.following.creditScore,
        } : null,
        createdAt: f.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取用户粉丝列表（关注我的人）
   */
  async getFollowers(userId: string, options: {
    page?: number;
    pageSize?: number;
  } = {}) {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    const [follows, total] = await this.followRepo.findAndCount({
      where: { followingId: userId },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: pageSize,
    });

    return {
      items: follows.map(f => ({
        id: f.id,
        user: f.follower ? {
          id: f.follower.id,
          companyName: f.follower.companyName,
          role: f.follower.role,
          verificationStatus: f.follower.verificationStatus,
        } : null,
        createdAt: f.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 检查是否已关注
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const count = await this.followRepo.count({
      where: { followerId, followingId },
    });
    return count > 0;
  }

  /**
   * 批量检查关注状态
   */
  async checkFollowing(userId: string, targetUserIds: string[]): Promise<Record<string, boolean>> {
    const follows = await this.followRepo.find({
      where: {
        followerId: userId,
        followingId: In(targetUserIds),
      },
      select: ['followingId'],
    });

    const result: Record<string, boolean> = {};
    targetUserIds.forEach(id => {
      result[id] = follows.some(f => f.followingId === id);
    });

    return result;
  }

  /**
   * 获取用户关注数和粉丝数
   */
  async getFollowStats(userId: string) {
    const followingCount = await this.followRepo.count({
      where: { followerId: userId },
    });

    const followerCount = await this.followRepo.count({
      where: { followingId: userId },
    });

    return {
      followingCount,
      followerCount,
    };
  }

  /**
   * 通过库存ID关注卖家
   */
  async followByInventory(followerId: string, inventoryId: string) {
    const inventoryRepo = AppDataSource.getRepository(Inventory);

    // 查找库存
    const inventory = await inventoryRepo.findOne({
      where: { id: inventoryId },
    });

    if (!inventory) {
      throw new Error('库存不存在');
    }

    // 不能关注自己
    if (followerId === inventory.sellerId) {
      throw new Error('不能关注自己');
    }

    // 调用原有的关注方法
    return this.followUser(followerId, inventory.sellerId);
  }
}

export const followService = new FollowService();
