import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// SQLite 数据库文件路径
const dbPath = join(__dirname, '../../data/trading.db');

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: dbPath,
  synchronize: true, // 自动同步表结构
  logging: false, // 关闭SQL日志减少噪音
  entities: [join(__dirname, '../models/*.{js,ts}')],
});

export const initDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ 数据库连接成功 (SQLite)');
    return AppDataSource;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    throw error;
  }
};
