import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

import type { Bindings, Variables } from './types';
import { errorHandler } from './middlewares/error.middleware';
import routes from './routes/index';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 中间件
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());

// CORS 配置
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'https://mjalvin234.github.io',
    'https://mjalvin234.github.io',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// API 路由
app.route('/api', routes);

// 健康检查
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 处理
app.notFound((c) => {
  return c.json({
    success: false,
    error: { message: '接口不存在' },
  }, 404);
});

// 错误处理
app.onError(errorHandler);

export default app;
