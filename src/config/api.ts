// API 基础地址配置
export const API_BASE = import.meta.env.PROD
  ? 'https://ecommerce-platform.mjalvin234-18e.workers.dev/api'
  : '/api';

// 获取完整的 API URL
export const getApiUrl = (path: string) => {
  // 移除开头的斜杠（如果有）
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  if (import.meta.env.PROD) {
    return `https://ecommerce-platform.mjalvin234-18e.workers.dev/api/${cleanPath}`;
  }
  return `/api/${cleanPath}`;
};
