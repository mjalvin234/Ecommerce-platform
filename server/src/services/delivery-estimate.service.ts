/**
 * 配送时效配置
 * 基于地区预估配送时间
 */

interface DeliveryZone {
  provinces: string[];
  baseDays: number; // 基础天数
  name: string; // 区域名称
}

/**
 * 配送区域配置
 * 根据中国地理区域划分
 */
const DELIVERY_ZONES: DeliveryZone[] = [
  {
    name: '华东地区',
    provinces: ['上海', '江苏', '浙江', '安徽', '福建', '江西', '山东'],
    baseDays: 1,
  },
  {
    name: '华南地区',
    provinces: ['广东', '广西', '海南'],
    baseDays: 2,
  },
  {
    name: '华北地区',
    provinces: ['北京', '天津', '河北', '山西', '内蒙古'],
    baseDays: 2,
  },
  {
    name: '华中地区',
    provinces: ['河南', '湖北', '湖南'],
    baseDays: 2,
  },
  {
    name: '西南地区',
    provinces: ['重庆', '四川', '贵州', '云南', '西藏'],
    baseDays: 3,
  },
  {
    name: '西北地区',
    provinces: ['陕西', '甘肃', '青海', '宁夏', '新疆'],
    baseDays: 4,
  },
  {
    name: '东北地区',
    provinces: ['辽宁', '吉林', '黑龙江'],
    baseDays: 3,
  },
];

/**
 * 快递公司时效系数
 */
const CARRIER_FACTORS: Record<string, number> = {
  '顺丰': 1.0,      // 最快
  '京东': 1.0,
  '中通': 1.2,
  '圆通': 1.2,
  '申通': 1.2,
  '韵达': 1.2,
  '极兔': 1.3,
  '德邦': 1.1,
  '跨越': 1.0,
  'EMS': 1.3,
  'default': 1.2,
};

/**
 * 交期计算服务
 */
export class DeliveryEstimateService {
  /**
   * 根据地址获取配送区域
   */
  private getDeliveryZone(address: string): DeliveryZone {
    for (const zone of DELIVERY_ZONES) {
      if (zone.provinces.some(p => address.includes(p))) {
        return zone;
      }
    }
    // 默认返回华东（假设QA中心在华东）
    return { name: '其他地区', provinces: [], baseDays: 3 };
  }

  /**
   * 计算预计到货时间
   */
  calculateEstimatedDelivery(params: {
    fromAddress: string;  // 发货地址
    toAddress: string;    // 收货地址
    carrier?: string;     // 快递公司
  }): {
    estimatedDays: number;
    estimatedDate: Date;
    zoneName: string;
    breakdown: {
      baseDays: number;
      carrierFactor: number;
      regionDays: number;
    };
  } {
    const { fromAddress, toAddress, carrier = 'default' } = params;

    // 获取目标区域
    const zone = this.getDeliveryZone(toAddress);

    // 获取快递公司系数
    const carrierFactor = CARRIER_FACTORS[carrier] || CARRIER_FACTORS['default'];

    // 计算总天数
    const baseDays = zone.baseDays;
    const estimatedDays = Math.ceil(baseDays * carrierFactor);

    // 计算预计日期（工作日）
    const estimatedDate = this.addBusinessDays(new Date(), estimatedDays);

    return {
      estimatedDays,
      estimatedDate,
      zoneName: zone.name,
      breakdown: {
        baseDays,
        carrierFactor,
        regionDays: estimatedDays,
      },
    };
  }

  /**
   * 计算QA质检时效
   */
  calculateQATime(params: {
    inventoryBrand?: string;
    inventoryYear?: number;
    quantity: number;
  }): {
    qaDays: number;
    qaEndDate: Date;
    notes: string[];
  } {
    const { inventoryBrand, inventoryYear, quantity } = params;
    const notes: string[] = [];

    // 基础质检时间：1天
    let qaDays = 1;

    // 数量超过100个，增加0.5天
    if (quantity > 100) {
      qaDays += 0.5;
      notes.push('数量较多，质检时间增加');
    }

    // 年份超过5年的芯片，需要额外检测
    const currentYear = new Date().getFullYear();
    if (inventoryYear && currentYear - inventoryYear > 5) {
      qaDays += 1;
      notes.push('芯片年份较老，需额外老化测试');
    }

    // 特殊品牌需要专项检测
    const specialBrands = ['TI', 'ADI', 'Xilinx', 'Intel', 'NVIDIA'];
    if (inventoryBrand && specialBrands.some(b => inventoryBrand.toUpperCase().includes(b))) {
      qaDays += 0.5;
      notes.push('高端品牌芯片，进行专项检测');
    }

    const qaEndDate = this.addBusinessDays(new Date(), Math.ceil(qaDays));

    return {
      qaDays: Math.ceil(qaDays),
      qaEndDate,
      notes,
    };
  }

  /**
   * 计算完整交期
   */
  calculateFullDelivery(params: {
    sellerAddress: string;   // 卖家地址
    qaCenterAddress: string; // QA中心地址
    buyerAddress: string;    // 买家地址
    carrier?: string;
    inventoryBrand?: string;
    inventoryYear?: number;
    quantity: number;
  }): {
    totalDays: number;
    estimatedCompletionDate: Date;
    stages: {
      sellerToQA: { days: number; date: Date };
      qaInspection: { days: number; date: Date };
      qaToBuyer: { days: number; date: Date };
    };
    notes: string[];
  } {
    const {
      sellerAddress,
      qaCenterAddress,
      buyerAddress,
      carrier,
      inventoryBrand,
      inventoryYear,
      quantity,
    } = params;

    const notes: string[] = [];
    let currentDate = new Date();

    // 阶段1: 卖家发货到QA中心
    const sellerToQA = this.calculateEstimatedDelivery({
      fromAddress: sellerAddress,
      toAddress: qaCenterAddress,
      carrier,
    });
    currentDate = sellerToQA.estimatedDate;

    // 阶段2: QA质检
    const qaInspection = this.calculateQATime({
      inventoryBrand,
      inventoryYear,
      quantity,
    });
    notes.push(...qaInspection.notes);
    currentDate = this.addBusinessDays(currentDate, qaInspection.qaDays);

    // 阶段3: QA发货给买家
    const qaToBuyer = this.calculateEstimatedDelivery({
      fromAddress: qaCenterAddress,
      toAddress: buyerAddress,
      carrier,
    });
    currentDate = qaToBuyer.estimatedDate;

    // 总天数
    const totalDays =
      sellerToQA.estimatedDays +
      qaInspection.qaDays +
      qaToBuyer.estimatedDays;

    return {
      totalDays,
      estimatedCompletionDate: currentDate,
      stages: {
        sellerToQA: { days: sellerToQA.estimatedDays, date: sellerToQA.estimatedDate },
        qaInspection: { days: qaInspection.qaDays, date: qaInspection.qaEndDate },
        qaToBuyer: { days: qaToBuyer.estimatedDays, date: qaToBuyer.estimatedDate },
      },
      notes,
    };
  }

  /**
   * 添加工作日（跳过周末）
   */
  private addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let addedDays = 0;

    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      // 0 = 周日, 6 = 周六
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        addedDays++;
      }
    }

    return result;
  }

  /**
   * 格式化交期信息
   */
  formatDeliveryInfo(delivery: ReturnType<typeof this.calculateFullDelivery>): string {
    const formatDate = (date: Date) =>
      date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });

    return `
预计总交期: ${delivery.totalDays} 个工作日
预计完成日期: ${formatDate(delivery.estimatedCompletionDate)}

阶段明细:
- 卖家发货到QA: ${delivery.stages.sellerToQA.days}天 (预计${formatDate(delivery.stages.sellerToQA.date)})
- QA质检: ${delivery.stages.qaInspection.days}天
- 发货给买家: ${delivery.stages.qaToBuyer.days}天 (预计${formatDate(delivery.stages.qaToBuyer.date)})

${delivery.notes.length > 0 ? '备注:\n' + delivery.notes.map(n => `- ${n}`).join('\n') : ''}
    `.trim();
  }
}

export const deliveryEstimateService = new DeliveryEstimateService();
