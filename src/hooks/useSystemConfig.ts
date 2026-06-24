import { useState, useEffect } from 'react';
import { api } from '../api/client';

/**
 * 系统配置类型
 */
export interface SystemConfig {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  businessEmail?: string;
  privacyEmail?: string;
  legalEmail?: string;
  address: string;
  labInfo?: string;
  companyName: string;
  foundedYear: string;
  registeredCapital: string;
  employeeCount: string;
  customerCount: string;
  // 平台对公账户信息
  platformBankName?: string;
  platformBankAccount?: string;
  platformBankHolder?: string;
}

/**
 * 默认配置（作为后备）
 */
const defaultConfig: SystemConfig = {
  siteName: '芯核交易中心',
  siteDescription: '专业的电子元器件交易平台',
  contactEmail: 'support@coretrading.com',
  contactPhone: '400-888-8888',
  businessEmail: 'business@coretrading.com',
  privacyEmail: 'privacy@coretrading.com',
  legalEmail: 'legal@coretrading.com',
  address: '广东省深圳市龙岗区平湖街道XX物流园3区',
  labInfo: '芯核质检实验室（工号099X）',
  companyName: '深圳芯核科技有限公司',
  foundedYear: '2024',
  registeredCapital: '1000万元',
  employeeCount: '50-100人',
  customerCount: '1000+',
  platformBankName: '招商银行深圳科苑支行',
  platformBankAccount: '7559 8888 6666 888',
  platformBankHolder: '芯核交易平台（深圳）资金暂存专户',
};

/**
 * 全局配置缓存
 */
let configCache: SystemConfig | null = null;
let configPromise: Promise<SystemConfig> | null = null;

/**
 * 获取系统配置（带缓存）
 */
export async function getSystemConfig(): Promise<SystemConfig> {
  // 如果已有缓存，直接返回
  if (configCache) {
    return configCache;
  }

  // 如果正在请求中，等待结果
  if (configPromise) {
    return configPromise;
  }

  // 发起请求
  configPromise = api.getPublicSystemConfig()
    .then((config) => {
      configCache = config;
      return config;
    })
    .catch((err) => {
      console.error('获取系统配置失败:', err);
      return defaultConfig;
    })
    .finally(() => {
      configPromise = null;
    });

  return configPromise;
}

/**
 * 清除配置缓存
 */
export function clearConfigCache() {
  configCache = null;
}

/**
 * Hook: 获取系统配置
 */
export function useSystemConfig() {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemConfig().then((result) => {
      setConfig(result);
      setLoading(false);
    });
  }, []);

  return { config, loading };
}

export default useSystemConfig;
