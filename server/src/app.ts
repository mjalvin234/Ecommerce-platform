import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config/index.js';
import { initDatabase, AppDataSource } from './config/database.js';
import { User } from './models/User.js';
import { paymentConfigRepository } from './repositories/payment.repository.js';
import { notificationConfigRepository } from './repositories/notification-config.repository.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { schedulerService } from './services/scheduler.service.js';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 验证密码强度
 * 至少8位，包含大小写字母和数字
 */
function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: '密码至少8位' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码需包含小写字母' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码需包含大写字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码需包含数字' };
  }
  return { valid: true, message: '' };
}

/**
 * 初始化管理员账号
 * 从环境变量读取配置，首次启动时自动创建
 */
async function initAdminAccount() {
  const userRepo = AppDataSource.getRepository(User);
  const adminCount = await userRepo.count({ where: { role: 'admin' } as any });

  // 已有管理员，跳过
  if (adminCount > 0) return;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || '管理员';

  // 未配置环境变量，提示用户
  if (!adminEmail || !adminPassword) {
    console.log('\n' + '═'.repeat(50));
    console.log('🔔 检测到首次启动，请创建管理员账号');
    console.log('═'.repeat(50));
    console.log('\n方式一：在 .env 文件中配置：');
    console.log('  ADMIN_EMAIL=your@email.com');
    console.log('  ADMIN_PASSWORD=YourPassword123');
    console.log('  ADMIN_NAME=您的公司名\n');
    console.log('方式二：运行命令创建：');
    console.log('  npm run create-admin\n');
    console.log('═'.repeat(50) + '\n');
    return;
  }

  // 验证密码强度
  const validation = validatePassword(adminPassword);
  if (!validation.valid) {
    console.error(`❌ 管理员密码不符合安全要求: ${validation.message}`);
    console.error('   密码需至少8位，包含大小写字母和数字\n');
    process.exit(1);
    return;
  }

  // 验证邮箱格式
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    console.error('❌ 管理员邮箱格式不正确\n');
    process.exit(1);
    return;
  }

  // 检查邮箱是否已存在
  const existingUser = await userRepo.findOne({ where: { email: adminEmail.toLowerCase() } } as any);
  if (existingUser) {
    console.log('⚠️  管理员邮箱已存在，跳过创建\n');
    return;
  }

  // 创建管理员
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = userRepo.create({
    id: uuidv4(),
    email: adminEmail.toLowerCase(),
    passwordHash,
    companyName: adminName,
    role: 'admin',
    verificationStatus: 'verified',
    anonymousHash: `ADM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    creditScore: 100,
  });

  await userRepo.save(admin);
  console.log('✅ 管理员账号自动创建成功');
  console.log(`   📧 邮箱: ${admin.email}\n`);
}

const app = express();

// 中间件
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务已移除 - 所有文件访问必须通过带认证的 API 接口
// 这样可以确保只有登录用户才能访问上传的敏感文件（如营业执照、身份证等）
// 文件访问接口：GET /api/uploads/certification/:filename（需要认证）

// 请求日志
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 路由
app.use('/api', routes);

// 404 处理
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { message: '接口不存在' },
  });
});

// 错误处理
app.use(errorHandler);

// 启动服务器
async function start() {
  try {
    // 确保 data 目录存在
    const dataDir = join(__dirname, '../data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    await initDatabase();

    // 初始化管理员账号（如果配置了环境变量）
    await initAdminAccount();

    // 初始化默认支付配置
    await paymentConfigRepository.initDefaultConfigs();
    console.log('✅ 支付配置初始化完成');

    // 初始化通知配置默认数据
    await notificationConfigRepository.initializeDefaults();
    console.log('✅ 通知配置初始化完成');

    // 启动定时任务
    schedulerService.start();

    app.listen(config.port, () => {
      console.log(`\n🚀 服务器已启动: http://localhost:${config.port}\n`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

start();
