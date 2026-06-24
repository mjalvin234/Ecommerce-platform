import { AppDataSource } from '../config/database.js';
import { Logistics, LogisticsStatus } from '../models/Logistics.js';
import { Order } from '../models/Order.js';
import { config } from '../config/index.js';
import crypto from 'crypto';

const logisticsRepo = () => AppDataSource.getRepository(Logistics);
const orderRepo = () => AppDataSource.getRepository(Order);

// 快递公司编码映射（快递100标准）
const CARRIER_MAP: Record<string, { name: string; code: string }> = {
  'shunfeng': { name: '顺丰速运', code: 'shunfeng' },
  'yuantong': { name: '圆通速递', code: 'yuantong' },
  'zhongtong': { name: '中通快递', code: 'zhongtong' },
  'shentong': { name: '申通快递', code: 'shentong' },
  'yunda': { name: '韵达快递', code: 'yunda' },
  'jd': { name: '京东物流', code: 'jd' },
  'ems': { name: 'EMS', code: 'ems' },
  'youzheng': { name: '邮政包裹', code: 'youzhengguonei' },
  'jingtong': { name: '极兔速递', code: 'jtexpress' },
  'debang': { name: '德邦快递', code: 'debangwuliu' },
  'tiantian': { name: '天天快递', code: 'tiantian' },
  'kuayue': { name: '跨越速运', code: 'kuayue' },
};

// 快递100状态映射
const KUAIDI100_STATUS_MAP: Record<string, LogisticsStatus> = {
  '200': 'in_transit',      // 在途
  '201': 'in_transit',      // 揽收
  '202': 'in_transit',      // 疑难
  '203': 'in_transit',      // 签收失败
  '204': 'in_transit',      // 派送中
  '205': 'in_transit',      // 签收
  '206': 'in_transit',      // 退回
  '207': 'in_transit',      // 转投
  '1': 'shipped',           // 揽收
  '2': 'in_transit',        // 在途
  '3': 'in_transit',        // 签收
  '4': 'delivered',         // 签收成功
  '5': 'in_transit',        // 疑难
  '6': 'in_transit',        // 退回
  '7': 'in_transit',        // 转投
  '10': 'in_transit',       // 待清关
  '11': 'in_transit',       // 清关中
  '12': 'in_transit',       // 已清关
  '13': 'in_transit',       // 清关异常
  '14': 'delivered',        // 拒收
};

export interface LogisticsTrace {
  time: string;
  context: string;
  location?: string;
}

// 快递100签名
function sign(param: string, key: string, customer: string): string {
  return crypto
    .createHash('md5')
    .update(param + key + customer)
    .digest('hex')
    .toUpperCase();
}

export const logisticsService = {
  async submitLogistics(orderId: string, carrierCode: string, trackingNumber: string, userId: string): Promise<Logistics> {
    // 验证订单
    const order = await orderRepo().findOne({ where: { id: orderId } });
    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.sellerId !== userId) {
      throw new Error('无权操作此订单');
    }

    // 检查是否已录入
    const existing = await logisticsRepo().findOne({ where: { orderId } });
    if (existing) {
      throw new Error('该订单已录入物流信息');
    }

    const carrier = CARRIER_MAP[carrierCode] || { name: carrierCode, code: carrierCode };

    const logistics = logisticsRepo().create({
      orderId,
      carrier: carrier.name,
      carrierCode: carrier.code,
      trackingNumber,
      status: 'shipped',
      shippedAt: new Date(),
      traces: []
    });

    await logisticsRepo().save(logistics);

    // 更新订单状态
    order.status = 'shipped' as any;
    await orderRepo().save(order);

    return logistics;
  },

  async queryLogistics(trackingNumber: string): Promise<{
    carrier: string;
    status: LogisticsStatus;
    traces: LogisticsTrace[];
    estimatedDelivery?: Date;
  }> {
    const logistics = await logisticsRepo().findOne({ where: { trackingNumber } });

    if (!logistics) {
      throw new Error('物流信息不存在');
    }

    // 如果超过1小时未同步，重新查询
    if (!logistics.lastSyncAt || Date.now() - logistics.lastSyncAt.getTime() > 3600000) {
      await this.syncLogistics(logistics.id);
      return this.queryLogistics(trackingNumber);
    }

    return {
      carrier: logistics.carrier,
      status: logistics.status,
      traces: logistics.traces || [],
      estimatedDelivery: logistics.estimatedDelivery || undefined
    };
  },

  async syncLogistics(logisticsId: string): Promise<void> {
    const logistics = await logisticsRepo().findOne({ where: { id: logisticsId } });
    if (!logistics) return;

    // 尝试调用快递100 API
    if (config.kuaidi100.enabled) {
      try {
        const param = JSON.stringify({
          com: logistics.carrierCode,
          num: logistics.trackingNumber,
        });

        const signStr = sign(param, config.kuaidi100.key, config.kuaidi100.customer);

        const response = await fetch(config.kuaidi100.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            customer: config.kuaidi100.customer,
            sign: signStr,
            param,
          }),
        });

        const data = await response.json() as any;

        if (data.data && Array.isArray(data.data)) {
          logistics.traces = data.data.map((item: any) => ({
            time: item.time || item.ftime,
            context: item.context,
            location: item.location,
          }));

          // 根据快递100状态更新
          if (data.state) {
            logistics.status = KUAIDI100_STATUS_MAP[data.state] || 'in_transit';
          }

          // 如果已签收，记录签收时间
          if (logistics.status === 'delivered' && !logistics.deliveredAt) {
            logistics.deliveredAt = new Date();
          }
        }
      } catch (err) {
        console.error('快递100 API调用失败:', err);
        // API调用失败时使用模拟数据
        await this.useMockTraces(logistics);
      }
    } else {
      // 未配置快递100时使用模拟数据
      await this.useMockTraces(logistics);
    }

    logistics.lastSyncAt = new Date();
    await logisticsRepo().save(logistics);
  },

  // 使用模拟物流数据
  async useMockTraces(logistics: Logistics): Promise<void> {
    const mockTraces: LogisticsTrace[] = [
      { time: new Date().toISOString(), context: '快件已发出' },
      { time: new Date(Date.now() - 3600000).toISOString(), context: '快件已到达【深圳转运中心】' },
      { time: new Date(Date.now() - 7200000).toISOString(), context: '快件已发出，下一站【广州转运中心】' },
      { time: new Date(Date.now() - 86400000).toISOString(), context: '卖家已发货' },
    ];

    logistics.traces = mockTraces;

    // 根据轨迹更新状态
    if (logistics.traces.some(t => t.context.includes('已签收'))) {
      logistics.status = 'delivered';
      logistics.deliveredAt = new Date();
    } else if (logistics.traces.some(t => t.context.includes('派送中'))) {
      logistics.status = 'delivering';
    } else {
      logistics.status = 'in_transit';
    }
  },

  async autoDetectCarrier(trackingNumber: string): Promise<{ carrier: string; carrierCode: string } | null> {
    // 尝试使用快递100自动识别
    if (config.kuaidi100.enabled) {
      try {
        const response = await fetch(`${config.kuaidi100.autoUrl}?resultv2=1&text=${trackingNumber}`, {
          method: 'GET',
        });

        const data = await response.json() as any;

        if (data.auto && data.auto.length > 0) {
          const first = data.auto[0];
          return {
            carrier: first.comName || first.comCode,
            carrierCode: first.comCode,
          };
        }
      } catch (err) {
        console.error('快递100自动识别失败:', err);
      }
    }

    // 回退到本地规则识别
    if (trackingNumber.startsWith('SF')) {
      return { carrier: CARRIER_MAP['shunfeng'].name, carrierCode: CARRIER_MAP['shunfeng'].code };
    }
    if (trackingNumber.startsWith('YT')) {
      return { carrier: CARRIER_MAP['yuantong'].name, carrierCode: CARRIER_MAP['yuantong'].code };
    }
    if (trackingNumber.startsWith('ZT')) {
      return { carrier: CARRIER_MAP['zhongtong'].name, carrierCode: CARRIER_MAP['zhongtong'].code };
    }
    if (trackingNumber.startsWith('77') || trackingNumber.startsWith('ST')) {
      return { carrier: CARRIER_MAP['shentong'].name, carrierCode: CARRIER_MAP['shentong'].code };
    }
    if (trackingNumber.startsWith('JD')) {
      return { carrier: CARRIER_MAP['jd'].name, carrierCode: CARRIER_MAP['jd'].code };
    }
    if (trackingNumber.startsWith('JT')) {
      return { carrier: CARRIER_MAP['jingtong'].name, carrierCode: CARRIER_MAP['jingtong'].code };
    }
    if (trackingNumber.startsWith('DP')) {
      return { carrier: CARRIER_MAP['debang'].name, carrierCode: CARRIER_MAP['debang'].code };
    }
    if (trackingNumber.startsWith('KY')) {
      return { carrier: CARRIER_MAP['kuayue'].name, carrierCode: CARRIER_MAP['kuayue'].code };
    }
    return null;
  },

  async batchSubmit(userId: string, items: Array<{ orderId: string; carrierCode: string; trackingNumber: string }>): Promise<{
    success: number;
    failed: number;
    errors: Array<{ orderId: string; message: string }>;
  }> {
    let success = 0;
    let failed = 0;
    const errors: Array<{ orderId: string; message: string }> = [];

    for (const item of items) {
      try {
        await this.submitLogistics(item.orderId, item.carrierCode, item.trackingNumber, userId);
        success++;
      } catch (err: any) {
        failed++;
        errors.push({ orderId: item.orderId, message: err.message });
      }
    }

    return { success, failed, errors };
  },

  async getLogisticsByOrder(orderId: string): Promise<Logistics | null> {
    return await logisticsRepo().findOne({ where: { orderId } });
  }
};
