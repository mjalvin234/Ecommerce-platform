import { Request, Response, NextFunction } from 'express';
import { followService } from '../services/follow.service.js';
import { success } from '../utils/response.js';

export class FollowController {
  /**
   * 关注用户
   * POST /api/follows
   */
  async followUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: targetUserId } = req.body;
      const currentUserId = req.user!.id;

      const result = await followService.followUser(currentUserId, targetUserId);
      return success(res, result, '关注成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取消关注
   * DELETE /api/follows/:userId
   */
  async unfollowUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: targetUserId } = req.params;
      const currentUserId = req.user!.id;

      const result = await followService.unfollowUser(currentUserId, targetUserId);
      return success(res, { success: result }, result ? '取消关注成功' : '取消关注失败');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取关注列表（我关注的人）
   * GET /api/follows/following
   */
  async getFollowing(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', pageSize = '20' } = req.query;
      const userId = req.user!.id;

      const result = await followService.getFollowing(userId, {
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10),
      });

      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取粉丝列表（关注我的人）
   * GET /api/follows/followers
   */
  async getFollowers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', pageSize = '20' } = req.query;
      const userId = req.user!.id;

      const result = await followService.getFollowers(userId, {
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10),
      });

      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取关注统计
   * GET /api/follows/stats
   */
  async getFollowStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await followService.getFollowStats(userId);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 检查关注状态
   * POST /api/follows/check
   */
  async checkFollowing(req: Request, res: Response, next: NextFunction) {
    try {
      const { userIds } = req.body;
      const currentUserId = req.user!.id;

      const result = await followService.checkFollowing(currentUserId, userIds);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 通过库存ID关注卖家
   * POST /api/follows/by-inventory/:inventoryId
   */
  async followByInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const { inventoryId } = req.params;
      const currentUserId = req.user!.id;

      const result = await followService.followByInventory(currentUserId, inventoryId);
      return success(res, result, '关注成功');
    } catch (error) {
      next(error);
    }
  }
}

export const followController = new FollowController();
