import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { inventoryService } from '../services/inventory.service.js';
import { orderService } from '../services/order.service.js';
import { favoriteService } from '../services/favorite.service.js';
import { followService } from '../services/follow.service.js';
import { alertService } from '../services/alert.service.js';
import { creditService } from '../services/credit.service.js';
import { messageService } from '../services/message.service.js';
import { success } from '../utils/response.js';

const router = Router();

/**
 * 小程序首页数据
 * GET /api/miniprogram/home
 */
router.get('/home', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // 并行获取首页所需数据
    const [recentInventories, unreadMessages, unreadAlerts, creditInfo, followStats] = await Promise.all([
      inventoryService.search('', 1, 10),
      messageService.getUnreadCount(userId),
      alertService.getUnreadCount(userId),
      creditService.getUserCreditInfo(userId),
      followService.getFollowStats(userId),
    ]);

    return success(res, {
      recentInventories: recentInventories.items,
      notifications: {
        unreadMessages,
        unreadAlerts,
      },
      user: {
        creditInfo,
        followStats,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 小程序用户中心数据
 * GET /api/miniprogram/user-center
 */
router.get('/user-center', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const user = req.user!;

    const [creditInfo, followStats, favoriteCount, unreadMessages, pendingOrders] = await Promise.all([
      creditService.getUserCreditInfo(userId),
      followService.getFollowStats(userId),
      favoriteService.getFavoriteCount(userId),
      messageService.getUnreadCount(userId),
      user.role === 'buyer' ? orderService.getByBuyer(userId) : orderService.getBySeller(userId),
    ]);

    const filteredPending = (pendingOrders || []).filter(o => o.status === 'awaiting_payment').slice(0, 3);

    return success(res, {
      credit: creditInfo,
      social: {
        ...followStats,
        favoriteCount,
      },
      notifications: {
        unreadMessages,
      },
      pendingOrders: filteredPending,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 小程序消息中心
 * GET /api/miniprogram/messages
 */
router.get('/messages', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { page = '1', pageSize = '20', category } = req.query;
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);

    const result = await messageService.getMessages(userId, {
      category: category as 'order' | 'negotiation' | 'system' | undefined,
      limit: pageSizeNum,
      offset: (pageNum - 1) * pageSizeNum,
    });

    return success(res, {
      items: result,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 小程序库存搜索
 * GET /api/miniprogram/search
 */
router.get('/search', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyword, page = '1', pageSize = '20' } = req.query;

    const result = await inventoryService.search(
      (keyword as string) || '',
      parseInt(page as string, 10),
      parseInt(pageSize as string, 10)
    );

    return success(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * 小程序订单列表（简化版）
 * GET /api/miniprogram/orders
 */
router.get('/orders', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const user = req.user!;

    const orders = user.role === 'buyer'
      ? await orderService.getByBuyer(userId)
      : await orderService.getBySeller(userId);

    return success(res, {
      items: orders,
      total: orders.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 小程序我的收藏
 * GET /api/miniprogram/favorites
 */
router.get('/favorites', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { page = '1', pageSize = '20' } = req.query;

    const result = await favoriteService.getUserFavorites(userId, {
      page: parseInt(page as string, 10),
      pageSize: parseInt(pageSize as string, 10),
    });

    return success(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * 小程序我的关注
 * GET /api/miniprogram/following
 */
router.get('/following', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { page = '1', pageSize = '20' } = req.query;

    const result = await followService.getFollowing(userId, {
      page: parseInt(page as string, 10),
      pageSize: parseInt(pageSize as string, 10),
    });

    return success(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * 小程序预警通知
 * GET /api/miniprogram/alerts
 */
router.get('/alerts', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { page = '1', pageSize = '20' } = req.query;

    const result = await alertService.getUserAlerts(userId, {
      page: parseInt(page as string, 10),
      pageSize: parseInt(pageSize as string, 10),
    });

    return success(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * 小程序快捷下单
 * POST /api/miniprogram/quick-order
 */
router.post('/quick-order', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { inventoryId, quantity } = req.body;

    const result = await orderService.create(userId, {
      type: 'direct',
      inventoryId,
      quantity: parseInt(quantity, 10),
    });

    return success(res, result, '下单成功');
  } catch (error) {
    next(error);
  }
});

export default router;
