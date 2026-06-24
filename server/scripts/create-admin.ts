/**
 * 创建管理员账号脚本
 *
 * 使用方法：
 *   npm run create-admin
 *   或
 *   tsx scripts/create-admin.ts
 */

import 'reflect-metadata';
import * as readline from 'readline';
import { initDatabase, AppDataSource } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function createAdmin() {
  try {
    console.log('\n🔧 管理员账号创建工具\n');

    // 初始化数据库
    await initDatabase();
    const userRepo = AppDataSource.getRepository(User);

    // 检查是否已有管理员
    const existingAdmin = await userRepo.count({ where: { role: 'admin' } as any });
    if (existingAdmin > 0) {
      console.log('⚠️  已存在管理员账号，无需重复创建。\n');
      rl.close();
      process.exit(0);
    }

    // 获取管理员信息
    const email = await question('📧 请输入管理员邮箱: ');
    if (!email || !email.includes('@')) {
      console.log('❌ 邮箱格式不正确');
      rl.close();
      process.exit(1);
    }

    const companyName = await question('🏢 请输入公司/组织名称: ');
    if (!companyName) {
      console.log('❌ 公司名称不能为空');
      rl.close();
      process.exit(1);
    }

    const password = await question('🔑 请输入密码 (至少6位): ');
    if (!password || password.length < 6) {
      console.log('❌ 密码至少6位');
      rl.close();
      process.exit(1);
    }

    const confirmPassword = await question('🔑 请再次输入密码: ');
    if (password !== confirmPassword) {
      console.log('❌ 两次密码不一致');
      rl.close();
      process.exit(1);
    }

    // 创建管理员
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = userRepo.create({
      id: uuidv4(),
      email: email.toLowerCase().trim(),
      passwordHash,
      companyName,
      role: 'admin',
      verificationStatus: 'verified',
      anonymousHash: `ADM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    });

    await userRepo.save(admin);

    console.log('\n✅ 管理员账号创建成功！');
    console.log('═══════════════════════════════════');
    console.log(`📧 邮箱: ${admin.email}`);
    console.log(`🏢 组织: ${admin.companyName}`);
    console.log('═══════════════════════════════════\n');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建失败:', error);
    rl.close();
    process.exit(1);
  }
}

createAdmin();
