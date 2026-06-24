/**
 * 货物使用建议服务
 * 根据器件年份、品牌、存储条件提供使用建议
 */

interface UsageAdvice {
  category: 'storage' | 'usage' | 'testing' | 'warning';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
}

interface ChipAdvice {
  overallStatus: 'excellent' | 'good' | 'fair' | 'caution';
  advice: UsageAdvice[];
  recommendations: string[];
}

/**
 * 芯片存储条件建议
 */
const STORAGE_ADVICE: Record<string, { temp: string; humidity: string; notes: string }> = {
  'TI': { temp: '-40°C ~ 85°C', humidity: '< 60%', notes: 'TI芯片对湿度敏感，建议使用干燥剂存储' },
  'ADI': { temp: '-40°C ~ 85°C', humidity: '< 60%', notes: 'ADI模拟芯片需防静电存储' },
  'Xilinx': { temp: '-40°C ~ 100°C', humidity: '< 50%', notes: 'FPGA芯片需防潮，开封后尽快使用' },
  'Intel': { temp: '-40°C ~ 85°C', humidity: '< 60%', notes: 'Intel芯片需注意ESD防护' },
  'NVIDIA': { temp: '-40°C ~ 85°C', humidity: '< 60%', notes: 'GPU芯片建议低温存储' },
  'default': { temp: '-40°C ~ 85°C', humidity: '< 60%', notes: '标准存储条件' },
};

/**
 * 货物使用建议服务
 */
export class UsageAdviceService {
  /**
   * 获取芯片使用建议
   */
  getChipAdvice(params: {
    brand: string;
    model: string;
    year: number;
    quantity: number;
    storageCondition?: string;
  }): ChipAdvice {
    const { brand, model, year, quantity, storageCondition } = params;
    const advice: UsageAdvice[] = [];
    const recommendations: string[] = [];

    const currentYear = new Date().getFullYear();
    const chipAge = currentYear - year;

    // 整体状态评估
    let overallStatus: 'excellent' | 'good' | 'fair' | 'caution';
    if (chipAge <= 2) {
      overallStatus = 'excellent';
    } else if (chipAge <= 5) {
      overallStatus = 'good';
    } else if (chipAge <= 10) {
      overallStatus = 'fair';
    } else {
      overallStatus = 'caution';
    }

    // 1. 存储建议
    const storageKey = Object.keys(STORAGE_ADVICE).find(k =>
      brand.toUpperCase().includes(k)
    ) || 'default';
    const storage = STORAGE_ADVICE[storageKey];

    advice.push({
      category: 'storage',
      title: '存储条件建议',
      content: `温度: ${storage.temp}，湿度: ${storage.humidity}。${storage.notes}`,
      priority: 'high',
    });

    // 2. 年份相关建议
    if (chipAge > 5) {
      advice.push({
        category: 'warning',
        title: '芯片年限提醒',
        content: `此批次芯片已生产 ${chipAge} 年。虽然芯片本身无保质期限制，但建议进行老化测试后再投入使用。`,
        priority: chipAge > 10 ? 'high' : 'medium',
      });

      recommendations.push('建议进行100%功能测试');
      recommendations.push('建议进行高温老化测试（72小时）');
    }

    if (chipAge > 10) {
      advice.push({
        category: 'warning',
        title: '超长年限警告',
        content: `芯片生产已超过10年，可能存在引脚氧化、ESD敏感度增加等问题。建议优先用于非关键应用场景。`,
        priority: 'high',
      });

      recommendations.push('检查引脚氧化情况');
      recommendations.push('建议优先用于开发测试用途');
      recommendations.push('关键应用场景建议购买新批次');
    }

    // 3. 使用建议
    if (chipAge <= 3) {
      advice.push({
        category: 'usage',
        title: '使用建议',
        content: '芯片状态良好，可正常使用。建议遵循标准焊接工艺。',
        priority: 'low',
      });
    } else if (chipAge <= 7) {
      advice.push({
        category: 'usage',
        title: '使用建议',
        content: '芯片状态正常。建议使用前进行抽样测试，焊接前检查引脚状态。',
        priority: 'medium',
      });
    } else {
      advice.push({
        category: 'usage',
        title: '使用建议',
        content: '建议进行全面功能验证后再投入使用。对于BGA封装，建议使用X射线检测焊球状态。',
        priority: 'high',
      });
    }

    // 4. 测试建议
    if (chipAge > 3 || quantity > 100) {
      const testItems: string[] = [];

      if (chipAge > 3) {
        testItems.push('电参数测试');
      }
      if (chipAge > 5) {
        testItems.push('老化测试');
      }
      if (quantity > 100) {
        testItems.push('批次抽检');
      }

      advice.push({
        category: 'testing',
        title: '建议测试项目',
        content: `建议进行以下测试: ${testItems.join('、')}`,
        priority: chipAge > 5 ? 'high' : 'medium',
      });
    }

    // 5. 数量相关建议
    if (quantity > 1000) {
      advice.push({
        category: 'usage',
        title: '大批量使用建议',
        content: `大批量采购建议先小批量试产，验证工艺兼容性后再批量生产。`,
        priority: 'medium',
      });

      recommendations.push('建议先进行小批量试产验证');
    }

    // 6. 存储条件检查
    if (storageCondition) {
      if (storageCondition.includes('潮湿') || storageCondition.includes('进水')) {
        advice.push({
          category: 'warning',
          title: '存储条件警告',
          content: '检测到芯片可能受潮，建议进行烘焙处理（125°C，24小时）后再进行焊接，避免"爆米花"效应。',
          priority: 'high',
        });
        recommendations.push('进行烘焙除湿处理');
      }

      if (storageCondition.includes('高温')) {
        advice.push({
          category: 'warning',
          title: '存储条件警告',
          content: '高温存储可能影响芯片可靠性，建议进行老化测试验证。',
          priority: 'medium',
        });
      }
    }

    // 7. 特殊品牌建议
    const specialBrandAdvice = this.getSpecialBrandAdvice(brand, model);
    if (specialBrandAdvice) {
      advice.push(specialBrandAdvice);
    }

    // 生成推荐措施
    if (overallStatus === 'excellent') {
      recommendations.unshift('芯片状态优秀，可放心使用');
    } else if (overallStatus === 'good') {
      recommendations.unshift('芯片状态良好，建议按规范使用');
    } else if (overallStatus === 'fair') {
      recommendations.unshift('芯片状态一般，建议加强测试验证');
    } else {
      recommendations.unshift('建议谨慎使用，优先用于非关键场景');
    }

    return {
      overallStatus,
      advice,
      recommendations,
    };
  }

  /**
   * 获取特殊品牌建议
   */
  private getSpecialBrandAdvice(brand: string, model: string): UsageAdvice | null {
    const brandUpper = brand.toUpperCase();

    // FPGA相关
    if (brandUpper.includes('XILINX') || brandUpper.includes('ALTERA') || brandUpper.includes('INTEL')) {
      if (model.toUpperCase().includes('FPGA') || model.toUpperCase().includes('CPLD')) {
        return {
          category: 'usage',
          title: 'FPGA使用建议',
          content: 'FPGA芯片需注意配置芯片的兼容性。建议使用前验证配置数据完整性，并检查加密位状态。',
          priority: 'medium',
        };
      }
    }

    // 模拟芯片
    if (brandUpper.includes('ADI') || brandUpper.includes('TI')) {
      if (model.toUpperCase().includes('ADC') || model.toUpperCase().includes('DAC')) {
        return {
          category: 'usage',
          title: 'ADC/DAC使用建议',
          content: '高精度ADC/DAC对电源噪声敏感，建议使用低噪声电源，并注意热设计。',
          priority: 'medium',
        };
      }
    }

    // 存储芯片
    if (model.toUpperCase().includes('FLASH') || model.toUpperCase().includes('EEPROM')) {
      return {
        category: 'usage',
        title: '存储芯片使用建议',
        content: '存储芯片建议在使用前进行读写验证，并检查坏块情况（对于NAND Flash）。',
        priority: 'medium',
      };
    }

    // CPU/GPU
    if (model.toUpperCase().includes('CPU') || model.toUpperCase().includes('GPU') ||
        model.toUpperCase().includes('PROCESSOR')) {
      return {
        category: 'usage',
        title: '处理器使用建议',
        content: '处理器芯片需注意散热设计，建议验证热界面材料状态，并确保散热器安装正确。',
        priority: 'medium',
      };
    }

    return null;
  }

  /**
   * 获取存储条件建议
   */
  getStorageAdvice(brand: string): {
    temperature: string;
    humidity: string;
    specialNotes: string[];
  } {
    const storageKey = Object.keys(STORAGE_ADVICE).find(k =>
      brand.toUpperCase().includes(k)
    ) || 'default';
    const storage = STORAGE_ADVICE[storageKey];

    const specialNotes: string[] = [];
    if (storageKey !== 'default') {
      specialNotes.push(storage.notes);
    }

    // 通用建议
    specialNotes.push('避免阳光直射');
    specialNotes.push('远离强磁场');
    specialNotes.push('使用防静电包装');

    return {
      temperature: storage.temp,
      humidity: storage.humidity,
      specialNotes,
    };
  }

  /**
   * 生成使用建议报告
   */
  generateAdviceReport(params: {
    brand: string;
    model: string;
    year: number;
    quantity: number;
    storageCondition?: string;
  }): string {
    const advice = this.getChipAdvice(params);

    const statusEmoji = {
      excellent: '✅',
      good: '✅',
      fair: '⚠️',
      caution: '🔴',
    };

    let report = `
## 芯片使用建议报告

**品牌型号**: ${params.brand} ${params.model}
**生产年份**: ${params.year}
**数量**: ${params.quantity}
**整体评估**: ${statusEmoji[advice.overallStatus]} ${advice.overallStatus.toUpperCase()}

---

### 建议事项
`;

    advice.advice.forEach((item, index) => {
      const priorityEmoji = {
        high: '🔴',
        medium: '⚠️',
        low: 'ℹ️',
      };

      report += `
#### ${index + 1}. ${item.title} ${priorityEmoji[item.priority]}
${item.content}
`;
    });

    report += `
---

### 推荐措施
`;
    advice.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });

    return report;
  }
}

export const usageAdviceService = new UsageAdviceService();
