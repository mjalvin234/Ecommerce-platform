import type { Hono } from 'hono';

// 环境变量类型
export type Bindings = {
  DB: D1Database;
  UPLOADS: R2Bucket;
  ENVIRONMENT: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  ENCRYPTION_KEY: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_NAME?: string;
};

// 变量类型
export type Variables = {
  user?: {
    id: string;
    email: string;
    role: string;
  };
};

// 创建带类型的 Hono 实例
export type AppType = Hono<{ Bindings: Bindings; Variables: Variables }>;

// 导出类型供路由使用
export type Context = Parameters<Parameters<AppType['use']>[1]>[0];
