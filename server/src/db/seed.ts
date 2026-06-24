/**
 * 开发环境数据库种子数据
 *
 * ⚠️ 仅用于开发环境测试，生产环境请勿使用！
 *
 * 使用方法：
 *   npm run db:seed    # 初始化数据
 *   npm run db:reset   # 重置数据库
 */

import 'reflect-metadata';
import { AppDataSource, initDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { Inventory } from '../models/Inventory.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seed() {
  // 生产环境检查
  if (process.env.NODE_ENV === 'production') {
    console.log('❌ 生产环境禁止使用种子数据脚本');
    console.log('请使用 npm run create-admin 创建管理员账号\n');
    process.exit(1);
  }

  // 确保 data 目录存在
  const dataDir = join(__dirname, '../../data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  console.log('\n⚠️  警告：正在创建开发测试数据\n');
  console.log('🔄 正在初始化数据库...');
  await initDatabase();

  const userRepo = AppDataSource.getRepository(User);
  const inventoryRepo = AppDataSource.getRepository(Inventory);

  // 检查是否已有数据
  const existingUsers = await userRepo.count();
  if (existingUsers > 0) {
    console.log('⚠️ 数据库已有数据，跳过种子数据\n');
    return;
  }

  console.log('🔄 正在创建测试数据...');

  // 创建测试用户（仅开发环境）
  const passwordHash = await bcrypt.hash('Test1234', 10);

  const buyer = userRepo.create({
    id: uuidv4(),
    email: 'buyer@test.com',
    passwordHash,
    companyName: '测试买家公司',
    role: 'buyer',
    verificationStatus: 'verified',
    anonymousHash: `BYR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
  });

  const seller = userRepo.create({
    id: uuidv4(),
    email: 'seller@test.com',
    passwordHash,
    companyName: '测试卖家公司',
    role: 'seller',
    verificationStatus: 'verified',
    anonymousHash: `SLR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
  });

  const admin = userRepo.create({
    id: uuidv4(),
    email: 'admin@test.com',
    passwordHash,
    companyName: '平台管理方',
    role: 'admin',
    verificationStatus: 'verified',
    anonymousHash: `ADM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
  });

  await userRepo.save([buyer, seller, admin]);
  console.log('✅ 用户创建完成');

  // 为管理员设置默认信用分
  admin.creditScore = 100;
  await userRepo.save(admin);

  // 创建库存数据
  const inventoryData = [
    { partNumber: 'STM32F103C8T6', qty: 10000, year: '2025+', price: 10.45, eccn: 'EAR99', leadTime: '3 天内发货' },
    { partNumber: 'STM32F103C8T6', qty: 2500, year: '2024', price: 11.20, eccn: 'EAR99', leadTime: '现货直发' },
    { partNumber: 'XC7Z020-2CLG400I', qty: 500, year: '2024', price: 850.00, eccn: '3A991.d', leadTime: '现货' },
    { partNumber: 'ADUM1201ARZ', qty: 4500, year: '2023', price: 6.85, eccn: 'EAR99', leadTime: '现货' },
    { partNumber: 'ATMEGA328P-AU', qty: 15000, year: '2025', price: 12.00, eccn: 'EAR99', leadTime: '1 周发货' },
    { partNumber: 'NE555DR', qty: 50000, year: '2024', price: 0.25, eccn: 'EAR99', leadTime: '现货直发' },
    { partNumber: 'ESP32-WROOM-32E', qty: 8000, year: '2025+', price: 14.50, eccn: 'EAR99', leadTime: '3 天内发货' },
    { partNumber: 'LM358DR', qty: 120000, year: '2023', price: 0.15, eccn: 'EAR99', leadTime: '订货 (2周)' },
    { partNumber: 'STM32G474RET6', qty: 1200, year: '2023', price: 18.20, eccn: 'EAR99', leadTime: '现货' },
  ];

  const inventories = inventoryData.map((item) =>
    inventoryRepo.create({
      id: uuidv4(),
      sellerId: seller.id,
      partNumber: item.partNumber,
      quantity: item.qty,
      availableQty: item.qty,
      year: item.year,
      price: item.price,
      eccn: item.eccn,
      leadTime: item.leadTime,
      status: 'active',
    })
  );

  await inventoryRepo.save(inventories);
  console.log('✅ 库存数据创建完成');

  console.log('\n' + '═'.repeat(50));
  console.log('📝 开发测试账号（仅限开发环境）');
  console.log('═'.repeat(50));
  console.log('  买家: buyer@test.com');
  console.log('  卖家: seller@test.com');
  console.log('  管理员: admin@test.com');
  console.log('  密码: Test1234');
  console.log('═'.repeat(50) + '\n');

  console.log('✅ 数据库初始化完成！\n');
}

seed();
