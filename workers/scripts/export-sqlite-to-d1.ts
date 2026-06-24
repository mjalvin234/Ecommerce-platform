#!/usr/bin/env tsx
/**
 * 将 SQLite 数据库数据导出为 D1 迁移脚本
 * 运行：tsx scripts/export-sqlite-to-d1.ts
 */

import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// SQLite 数据库路径
const dbPath = join(__dirname, '../../server/data/trading.db');
const outputDir = join(__dirname, '../migrations');

// 创建输出目录
mkdirSync(outputDir, { recursive: true });

// 连接数据库
const db = new Database(dbPath, { readonly: true });

// 获取所有表名
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  .all() as { name: string }[];

console.log(`找到 ${tables.length} 个表：`, tables.map((t) => t.name).join(', '));

// 导出每个表的数据
let insertStatements = '';

for (const table of tables) {
  const tableName = table.name;

  // 获取表数据
  const rows = db.prepare(`SELECT * FROM ${tableName}`).all();

  if (rows.length === 0) {
    console.log(`表 ${tableName} 没有数据，跳过`);
    continue;
  }

  console.log(`导出表 ${tableName}：${rows.length} 条记录`);

  // 生成 INSERT 语句
  for (const row of rows) {
    const columns = Object.keys(row);
    const values = Object.values(row).map((value) => {
      if (value === null) return 'NULL';
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        // 转义单引号
        return `'${value.replace(/'/g, "''")}'`;
      }
      return `'${value}'`;
    });

    insertStatements += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
  }
  insertStatements += '\n';
}

// 写入文件
const outputFile = join(outputDir, '0002_seed_data.sql');
writeFileSync(outputFile, `-- 导出数据\n-- 生成时间：${new Date().toISOString()}\n\n${insertStatements}`);

console.log(`\n✅ 数据导出完成：${outputFile}`);
console.log(`总大小：${insertStatements.length} 字节`);

// 关闭数据库
db.close();
