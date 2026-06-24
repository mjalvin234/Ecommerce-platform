import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(process.cwd(), '.env') });

const jwtSecret = process.env.JWT_SECRET || (() => {
  console.error('❌ 致命错误: JWT_SECRET 环境变量未配置，服务拒绝启动。请在 server/.env 中设置一个强随机密钥。');
  process.exit(1);
  return '';
})();

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  // 快递100 API 配置
  kuaidi100: {
    key: process.env.KUAIDI100_KEY || '',
    customer: process.env.KUAIDI100_CUSTOMER || '',
    baseUrl: 'https://poll.kuaidi100.com/poll/query.do',
    autoUrl: 'https://www.kuaidi100.com/autonumber/autoComNum',
    enabled: !!(process.env.KUAIDI100_KEY && process.env.KUAIDI100_CUSTOMER),
  },
};
