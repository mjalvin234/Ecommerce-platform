import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service.js';
import { success } from '../utils/response.js';
import { PaymentChannel } from '../models/PaymentRecord.js';

export class PaymentController {
  /**
   * 创建支付订单
   * POST /api/payments/create
   */
  async createPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { orderId, channel } = req.body;

      if (!orderId || !channel) {
        return res.status(400).json({
          success: false,
          error: { message: '缺少必要参数' },
        });
      }

      if (!['alipay', 'wechat'].includes(channel)) {
        return res.status(400).json({
          success: false,
          error: { message: '不支持的支付方式' },
        });
      }

      const result = await paymentService.createPayment(userId, orderId, channel as PaymentChannel);
      return success(res, result, '支付订单创建成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 查询支付状态
   * GET /api/payments/:paymentNo/status
   */
  async queryStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentNo } = req.params;
      const result = await paymentService.queryPaymentStatus(paymentNo);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 支付宝回调
   * POST /api/payments/alipay/notify
   */
  async alipayNotify(req: Request, res: Response, next: NextFunction) {
    try {
      // 验证支付宝签名
      const isValid = await paymentService.verifyAlipaySign(req.body);
      if (!isValid) {
        console.error('[支付宝回调] 签名验证失败');
        return res.send('fail');
      }

      const { out_trade_no, trade_no, trade_status } = req.body;

      if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
        await paymentService.handlePaymentSuccess(out_trade_no, trade_no, req.body);
      }

      return res.send('success');
    } catch (error) {
      console.error('支付宝回调处理失败:', error);
      return res.send('fail');
    }
  }

  /**
   * 微信回调
   * POST /api/payments/wechat/notify
   */
  async wechatNotify(req: Request, res: Response, next: NextFunction) {
    try {
      // 验证微信签名
      const isValid = await paymentService.verifyWechatSign(req.headers, req.body);
      if (!isValid) {
        console.error('[微信回调] 签名验证失败');
        return res.json({ code: 'FAIL', message: '签名验证失败' });
      }

      const { out_trade_no, transaction_id } = req.body;

      if (transaction_id) {
        await paymentService.handlePaymentSuccess(out_trade_no, transaction_id, req.body);
      }

      return res.json({ code: 'SUCCESS', message: '成功' });
    } catch (error) {
      console.error('微信回调处理失败:', error);
      return res.json({ code: 'FAIL', message: '失败' });
    }
  }

  /**
   * 获取可用支付方式
   * GET /api/payments/channels
   */
  async getChannels(req: Request, res: Response, next: NextFunction) {
    try {
      const channels = await paymentService.getPaymentConfigs();
      return success(res, channels);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户支付记录
   * GET /api/payments/my
   */
  async getMyPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page = '1', pageSize = '20' } = req.query;

      const result = await paymentService.getUserPayments(
        userId,
        parseInt(page as string, 10),
        parseInt(pageSize as string, 10)
      );
      return success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取支付配置详情（管理员）
   * GET /api/payments/config
   */
  async getConfigs(req: Request, res: Response, next: NextFunction) {
    try {
      const configs = await paymentService.getPaymentConfigDetails();
      return success(res, configs);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新支付配置（管理员）
   * PUT /api/payments/config/:channel
   */
  async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      // 检查管理员权限
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: { message: '无权限访问' },
        });
      }

      const { channel } = req.params;
      const data = req.body;

      await paymentService.updatePaymentConfig(channel as PaymentChannel, data);
      return success(res, null, '配置更新成功');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 测试支付配置连接（管理员）
   * POST /api/payments/config/:channel/test
   */
  async testConfig(req: Request, res: Response, next: NextFunction) {
    try {
      // 检查管理员权限
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: { message: '无权限访问' },
        });
      }

      const { channel } = req.params;
      const result = await paymentService.testPaymentConnection(channel as PaymentChannel);
      return success(res, result, result.success ? '连接测试成功' : '连接测试失败');
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
