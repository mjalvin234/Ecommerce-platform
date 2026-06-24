import { Request, Response, NextFunction } from 'express';
import { settlementService } from '../services/settlement.service.js';
import { success } from '../utils/response.js';
import { SettleMethod } from '../models/SellerSettlement.js';

export class SettlementController {
  /**
   * 获取卖家结算记录
   * GET /api/settlements
   */
  async getMySettlements(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page = '1', pageSize = '20', status } = req.query;

      const result = await settlementService.getSellerSettlements(
        userId,
        parseInt(page as string, 10),
        parseInt(pageSize as string, 10),
        status as any
      );
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取结算详情
   * GET /api/settlements/:id
   */
  async getSettlementById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const result = await settlementService.getSettlementById(id, userId);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取待处理结算列表（管理员）
   * GET /api/settlements/pending
   */
  async getPendingSettlements(req: Request, res: Response, next: NextFunction) {
    try {
      // 检查管理员权限
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: { message: '无权限访问' },
        });
      }

      const { page = '1', pageSize = '20' } = req.query;

      const result = await settlementService.getPendingSettlements(
        parseInt(page as string, 10),
        parseInt(pageSize as string, 10)
      );
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 处理结算（管理员）
   * POST /api/settlements/:id/process
   */
  async processSettlement(req: Request, res: Response, next: NextFunction) {
    try {
      // 检查管理员权限
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: { message: '无权限访问' },
        });
      }

      const { id } = req.params;
      const { bankTransactionId } = req.body;

      // 如果是银行转账，需要提供交易号
      const settlement = await settlementService.getSettlementById(id);
      if (settlement.settleMethod === 'bank' && bankTransactionId) {
        const result = await settlementService.processBankSettlement(id, bankTransactionId);
        return success(res, result, '银行转账结算完成');
      }

      const result = await settlementService.processSettlement(id);
      return success(res, result, result.success ? '结算处理成功' : '结算处理失败');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 重试失败的结算
   * POST /api/settlements/:id/retry
   */
  async retrySettlement(req: Request, res: Response, next: NextFunction) {
    try {
      // 检查管理员权限
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: { message: '无权限访问' },
        });
      }

      const { id } = req.params;

      const result = await settlementService.retrySettlement(id);
      return success(res, result, result.success ? '结算重试成功' : '结算重试失败');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新卖家收款账号设置
   * PUT /api/settlements/account
   */
  async updateSettlementAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { method, alipayAccount, wechatOpenid, bankName, bankAccount, bankBranch } = req.body;

      if (!method || !['wechat', 'alipay', 'bank'].includes(method)) {
        return res.status(400).json({
          success: false,
          error: { message: '请选择有效的结算方式' },
        });
      }

      // 验证对应账号信息
      if (method === 'alipay' && !alipayAccount) {
        return res.status(400).json({
          success: false,
          error: { message: '请填写支付宝账号' },
        });
      }

      if (method === 'wechat' && !wechatOpenid) {
        return res.status(400).json({
          success: false,
          error: { message: '请先绑定微信账号' },
        });
      }

      if (method === 'bank' && (!bankName || !bankAccount)) {
        return res.status(400).json({
          success: false,
          error: { message: '请填写完整的银行账户信息' },
        });
      }

      await settlementService.updateSellerSettlementMethod(userId, method as SettleMethod, {
        alipayAccount,
        wechatOpenid,
        bankName,
        bankAccount,
        bankBranch,
      });

      return success(res, null, '收款账号设置成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取结算统计
   * GET /api/settlements/stats
   * 管理员获取全局统计，卖家获取自己的统计
   */
  async getSettlementStats(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;

      // 管理员获取全局统计
      if (user.role === 'admin') {
        const stats = await settlementService.getAdminSettlementStats();
        return success(res, stats);
      }

      // 卖家获取自己的统计
      const result = await settlementService.getSellerSettlements(user.id, 1, 1);
      return success(res, result.stats);
    } catch (error) {
      next(error);
    }
  }
}

export const settlementController = new SettlementController();
