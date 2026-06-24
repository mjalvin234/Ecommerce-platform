import { v4 as uuidv4 } from 'uuid';
import { settlementRepository } from '../repositories/settlement.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { SellerSettlement, SettlementStatus, SettleMethod } from '../models/SellerSettlement.js';
import { NotFoundError, ValidationError } from '../middlewares/error.middleware.js';
import { config } from '../config/index.js';
import crypto from 'crypto';
import https from 'https';

/**
 * 生成结算单号
 */
function generateSettlementNo(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SET-${timestamp}${random}`;
}

/**
 * 平台手续费率（可配置）
 */
const PLATFORM_FEE_RATE = parseFloat(process.env.PLATFORM_FEE_RATE || '0'); // 默认0%

/**
 * 结算服务
 */
export class SettlementService {
  /**
   * 创建结算单（订单完成时调用）
   */
  async createSettlement(orderId: string): Promise<SellerSettlement> {
    // 检查订单
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('订单不存在');
    }

    if (order.status !== 'completed') {
      throw new ValidationError('只有已完成的订单才能创建结算');
    }

    // 检查是否已有结算记录
    const existingSettlement = await settlementRepository.findByOrderId(orderId);
    if (existingSettlement) {
      return existingSettlement;
    }

    // 获取卖家信息
    const seller = await userRepository.findById(order.sellerId);
    if (!seller) {
      throw new NotFoundError('卖家不存在');
    }

    // 计算结算金额
    const orderAmount = Number(order.totalAmount);
    const platformFee = orderAmount * PLATFORM_FEE_RATE;
    const settleAmount = orderAmount - platformFee;

    // 确定结算方式（优先级：微信 > 支付宝 > 银行）
    let settleMethod: SettleMethod;
    if (seller.wechatOpenid) {
      settleMethod = 'wechat';
    } else if (seller.alipayAccount) {
      settleMethod = 'alipay';
    } else if (seller.bankAccount) {
      settleMethod = 'bank';
    } else {
      // 默认银行转账（需要卖家补充收款信息）
      settleMethod = 'bank';
    }

    // 创建结算记录
    const settlement = await settlementRepository.create({
      id: uuidv4(),
      settlementNo: generateSettlementNo(),
      orderId,
      sellerId: order.sellerId,
      amount: settleAmount,
      platformFee,
      orderAmount,
      status: 'pending',
      settleMethod,
      wechatOpenid: seller.wechatOpenid,
      alipayAccount: seller.alipayAccount,
      bankName: seller.bankName,
      bankAccount: seller.bankAccount,
      retryCount: 0,
    });

    console.log(`[结算服务] 创建结算单: ${settlement.settlementNo}, 订单: ${order.orderNumber}, 金额: ${settleAmount}`);

    return settlement;
  }

  /**
   * 处理微信企业付款
   */
  async processWechatSettlement(settlementId: string): Promise<{
    success: boolean;
    transactionId?: string;
    message?: string;
  }> {
    const settlement = await settlementRepository.findById(settlementId);
    if (!settlement) {
      throw new NotFoundError('结算记录不存在');
    }

    if (settlement.status === 'completed') {
      return { success: true, transactionId: settlement.wechatTransactionId };
    }

    // 更新状态为处理中
    await settlementRepository.updateStatus(settlementId, 'processing');

    try {
      // TODO: 调用微信企业付款API
      // 需要配置微信商户证书
      const result = await this.callWechatTransferAPI({
        openid: settlement.wechatOpenid!,
        amount: Number(settlement.amount) * 100, // 转换为分
        desc: `订单结算-${settlement.settlementNo}`,
        partnerTradeNo: settlement.settlementNo,
      });

      if (result.success) {
        await settlementRepository.updateStatus(settlementId, 'completed', {
          wechatTransactionId: result.payment_no,
          processedAt: new Date(),
          completedAt: new Date(),
        });

        console.log(`[微信结算] 成功: ${settlement.settlementNo}, 交易号: ${result.payment_no}`);
        return { success: true, transactionId: result.payment_no };
      } else {
        throw new Error(result.message || '微信付款失败');
      }
    } catch (error: any) {
      console.error(`[微信结算] 失败: ${settlement.settlementNo}`, error.message);

      await settlementRepository.updateStatus(settlementId, 'failed', {
        failReason: error.message,
        retryCount: settlement.retryCount + 1,
      });

      return { success: false, message: error.message };
    }
  }

  /**
   * 处理支付宝转账
   */
  async processAlipaySettlement(settlementId: string): Promise<{
    success: boolean;
    orderId?: string;
    message?: string;
  }> {
    const settlement = await settlementRepository.findById(settlementId);
    if (!settlement) {
      throw new NotFoundError('结算记录不存在');
    }

    if (settlement.status === 'completed') {
      return { success: true, orderId: settlement.alipayOrderId };
    }

    // 更新状态为处理中
    await settlementRepository.updateStatus(settlementId, 'processing');

    try {
      // TODO: 调用支付宝转账API
      const result = await this.callAlipayTransferAPI({
        account: settlement.alipayAccount!,
        amount: Number(settlement.amount),
        desc: `订单结算-${settlement.settlementNo}`,
        outBizNo: settlement.settlementNo,
      });

      if (result.success) {
        await settlementRepository.updateStatus(settlementId, 'completed', {
          alipayOrderId: result.orderId,
          processedAt: new Date(),
          completedAt: new Date(),
        });

        console.log(`[支付宝结算] 成功: ${settlement.settlementNo}, 订单号: ${result.orderId}`);
        return { success: true, orderId: result.orderId };
      } else {
        throw new Error(result.message || '支付宝转账失败');
      }
    } catch (error: any) {
      console.error(`[支付宝结算] 失败: ${settlement.settlementNo}`, error.message);

      await settlementRepository.updateStatus(settlementId, 'failed', {
        failReason: error.message,
        retryCount: settlement.retryCount + 1,
      });

      return { success: false, message: error.message };
    }
  }

  /**
   * 处理银行转账（人工处理）
   */
  async processBankSettlement(
    settlementId: string,
    transactionId: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    const settlement = await settlementRepository.findById(settlementId);
    if (!settlement) {
      throw new NotFoundError('结算记录不存在');
    }

    if (settlement.status === 'completed') {
      return { success: true };
    }

    // 银行转账需要人工处理，这里只是更新状态
    await settlementRepository.updateStatus(settlementId, 'completed', {
      bankTransactionId: transactionId,
      processedAt: new Date(),
      completedAt: new Date(),
    });

    console.log(`[银行结算] 完成: ${settlement.settlementNo}, 交易号: ${transactionId}`);
    return { success: true };
  }

  /**
   * 处理结算（自动选择方式）
   */
  async processSettlement(settlementId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    const settlement = await settlementRepository.findById(settlementId);
    if (!settlement) {
      throw new NotFoundError('结算记录不存在');
    }

    if (settlement.status === 'completed') {
      return { success: true };
    }

    switch (settlement.settleMethod) {
      case 'wechat':
        return this.processWechatSettlement(settlementId);
      case 'alipay':
        return this.processAlipaySettlement(settlementId);
      case 'bank':
        // 银行转账需要人工处理
        await settlementRepository.updateStatus(settlementId, 'processing', {
          processedAt: new Date(),
        });
        return {
          success: true,
          message: '银行转账需要人工处理，请在线下完成转账后更新状态',
        };
      default:
        return { success: false, message: '未知的结算方式' };
    }
  }

  /**
   * 重试失败的结算
   */
  async retrySettlement(settlementId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    const settlement = await settlementRepository.findById(settlementId);
    if (!settlement) {
      throw new NotFoundError('结算记录不存在');
    }

    if (settlement.status !== 'failed') {
      throw new ValidationError('只能重试失败的结算');
    }

    if (settlement.retryCount >= 3) {
      throw new ValidationError('已达到最大重试次数，请联系管理员处理');
    }

    // 重置状态为pending
    await settlementRepository.updateStatus(settlementId, 'pending', {
      failReason: undefined,
    });

    return this.processSettlement(settlementId);
  }

  /**
   * 获取卖家结算记录
   */
  async getSellerSettlements(
    sellerId: string,
    page: number = 1,
    pageSize: number = 20,
    status?: SettlementStatus
  ) {
    const offset = (page - 1) * pageSize;
    const [items, total] = await settlementRepository.findBySellerId(sellerId, {
      limit: pageSize,
      offset,
      status,
    });

    const stats = await settlementRepository.getSellerStats(sellerId);

    return {
      items: items.map(item => ({
        id: item.id,
        settlementNo: item.settlementNo,
        orderId: item.orderId,
        amount: item.amount,
        platformFee: item.platformFee,
        orderAmount: item.orderAmount,
        status: item.status,
        settleMethod: item.settleMethod,
        failReason: item.failReason,
        createdAt: item.createdAt,
        completedAt: item.completedAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      stats,
    };
  }

  /**
   * 获取待处理结算列表（管理员）
   */
  async getPendingSettlements(page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;
    const [items, total] = await settlementRepository.findPending({
      limit: pageSize,
      offset,
    });

    return items.map(item => ({
      id: item.id,
      settlementNo: item.settlementNo,
      sellerId: item.sellerId,
      seller: {
        id: item.seller?.id || item.sellerId,
        companyName: item.seller?.companyName || '未知卖家',
        alipayAccount: item.seller?.alipayAccount,
        bankName: item.seller?.bankName,
        bankAccount: item.seller?.bankAccount,
      },
      orderId: item.orderId,
      orderNumber: item.order?.orderNumber || item.orderId,
      amount: item.amount,
      paymentMethod: item.settleMethod,
      status: item.status,
      createdAt: item.createdAt,
    }));
  }

  /**
   * 获取结算详情
   */
  async getSettlementById(settlementId: string, userId?: string) {
    const settlement = await settlementRepository.findById(settlementId);
    if (!settlement) {
      throw new NotFoundError('结算记录不存在');
    }

    // 权限检查（卖家或管理员可查看）
    if (userId && settlement.sellerId !== userId) {
      throw new ValidationError('无权查看此结算记录');
    }

    return {
      id: settlement.id,
      settlementNo: settlement.settlementNo,
      orderId: settlement.orderId,
      sellerId: settlement.sellerId,
      amount: settlement.amount,
      platformFee: settlement.platformFee,
      orderAmount: settlement.orderAmount,
      status: settlement.status,
      settleMethod: settlement.settleMethod,
      wechatOpenid: settlement.wechatOpenid,
      wechatTransactionId: settlement.wechatTransactionId,
      alipayAccount: settlement.alipayAccount,
      alipayOrderId: settlement.alipayOrderId,
      bankName: settlement.bankName,
      bankAccount: settlement.bankAccount,
      bankTransactionId: settlement.bankTransactionId,
      failReason: settlement.failReason,
      retryCount: settlement.retryCount,
      createdAt: settlement.createdAt,
      processedAt: settlement.processedAt,
      completedAt: settlement.completedAt,
    };
  }

  /**
   * 获取管理员结算统计
   */
  async getAdminSettlementStats() {
    return settlementRepository.getAdminStats();
  }

  /**
   * 调用微信企业付款API
   * 文档: https://pay.weixin.qq.com/wiki/doc/api/tools/mch_pay.php
   */
  private async callWechatTransferAPI(params: {
    openid: string;
    amount: number;
    desc: string;
    partnerTradeNo: string;
  }): Promise<{
    success: boolean;
    payment_no?: string;
    message?: string;
  }> {
    // TODO: 实现真实的微信企业付款API调用
    // 需要配置以下环境变量:
    // WECHAT_MCH_ID - 商户号
    // WECHAT_APPID - 应用ID
    // WECHAT_API_KEY - API密钥
    // WECHAT_CERT_PATH - 商户证书路径
    // WECHAT_KEY_PATH - 商户私钥路径

    const mchId = process.env.WECHAT_MCH_ID;
    const appId = process.env.WECHAT_APPID_FOR_SETTLEMENT || process.env.WECHAT_APPID;

    if (!mchId || !appId) {
      console.warn('[微信结算] 未配置商户信息，使用模拟模式');
      // 模拟模式：开发测试时返回成功
      return {
        success: true,
        payment_no: `WX${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      };
    }

    // 真实API调用逻辑
    // 这里是伪代码，实际需要使用微信支付SDK
    try {
      /*
      const WxPay = require('wechatpay-node-v3');
      const pay = new WxPay({
        appid: appId,
        mchid: mchId,
        private_key: fs.readFileSync(process.env.WECHAT_KEY_PATH),
        serial_no: process.env.WECHAT_SERIAL_NO,
        apiv3_private_key: process.env.WECHAT_API_V3_KEY,
      });

      const result = await pay.transfer({
        appid: appId,
        mchid: mchId,
        openid: params.openid,
        amount: params.amount,
        description: params.desc,
        partner_trade_no: params.partnerTradeNo,
      });
      */

      // 暂时返回模拟成功
      console.log(`[微信API] 企业付款: openid=${params.openid}, amount=${params.amount}`);
      return {
        success: true,
        payment_no: `WX${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 调用支付宝转账API
   * 文档: https://opendocs.alipay.com/apis/api_28/alipay.fund.trans.uni.transfer
   */
  private async callAlipayTransferAPI(params: {
    account: string;
    amount: number;
    desc: string;
    outBizNo: string;
  }): Promise<{
    success: boolean;
    orderId?: string;
    message?: string;
  }> {
    // TODO: 实现真实的支付宝转账API调用
    // 需要配置以下环境变量:
    // ALIPAY_APPID - 应用ID
    // ALIPAY_PRIVATE_KEY - 应用私钥
    // ALIPAY_PUBLIC_KEY - 支付宝公钥

    const appId = process.env.ALIPAY_APPID;

    if (!appId) {
      console.warn('[支付宝结算] 未配置应用信息，使用模拟模式');
      // 模拟模式：开发测试时返回成功
      return {
        success: true,
        orderId: `ALI${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      };
    }

    // 真实API调用逻辑
    // 这里是伪代码，实际需要使用支付宝SDK
    try {
      /*
      const AlipaySdk = require('alipay-sdk').default;
      const alipaySdk = new AlipaySdk({
        appId: appId,
        privateKey: process.env.ALIPAY_PRIVATE_KEY,
        alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
      });

      const result = await alipaySdk.exec('alipay.fund.trans.uni.transfer', {
        bizContent: {
          out_biz_no: params.outBizNo,
          trans_amount: params.amount.toFixed(2),
          product_code: 'TRANS_ACCOUNT_NO_PWD',
          biz_scene: 'DIRECT_TRANSFER',
          payee_info: {
            identity: params.account,
            identity_type: 'ALIPAY_LOGON_ID',
          },
          remark: params.desc,
        },
      });
      */

      // 暂时返回模拟成功
      console.log(`[支付宝API] 转账: account=${params.account}, amount=${params.amount}`);
      return {
        success: true,
        orderId: `ALI${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 更新卖家的结算方式
   */
  async updateSellerSettlementMethod(
    sellerId: string,
    method: SettleMethod,
    accountInfo: {
      alipayAccount?: string;
      wechatOpenid?: string;
      bankName?: string;
      bankAccount?: string;
      bankBranch?: string;
    }
  ): Promise<void> {
    const user = await userRepository.findById(sellerId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    // 更新用户的收款账号信息
    await userRepository.update(sellerId, {
      alipayAccount: accountInfo.alipayAccount,
      wechatOpenid: accountInfo.wechatOpenid,
      bankName: accountInfo.bankName,
      bankAccount: accountInfo.bankAccount,
      bankBranch: accountInfo.bankBranch,
    });

    console.log(`[结算服务] 更新卖家收款方式: ${sellerId}, 方式: ${method}`);
  }
}

export const settlementService = new SettlementService();
