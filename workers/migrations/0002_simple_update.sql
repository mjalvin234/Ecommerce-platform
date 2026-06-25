-- 简化版迁移脚本
-- 请在 Cloudflare Dashboard > D1 > trading-center-db > Console 中执行

-- 1. 创建议价表
CREATE TABLE IF NOT EXISTS negotiations (
  id TEXT PRIMARY KEY,
  inventory_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  seller_price REAL NOT NULL,
  offer_price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT
);

-- 2. 创建消息表（新结构）
CREATE TABLE IF NOT EXISTS messages_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  related_data TEXT,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT
);

-- 3. 为 inventory 添加字段（如果不存在）
-- SQLite 会忽略已存在的列
ALTER TABLE inventory ADD COLUMN part_number TEXT;
ALTER TABLE inventory ADD COLUMN available_qty INTEGER;
ALTER TABLE inventory ADD COLUMN year TEXT;
ALTER TABLE inventory ADD COLUMN eccn TEXT;
ALTER TABLE inventory ADD COLUMN lead_time TEXT;

-- 4. 为 orders 添加字段
ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'direct';
ALTER TABLE orders ADD COLUMN part_number TEXT;
ALTER TABLE orders ADD COLUMN inventory_id TEXT;

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_inventory_part_number ON inventory(part_number);
CREATE INDEX IF NOT EXISTS idx_negotiations_buyer ON negotiations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_seller ON negotiations(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages_new(user_id);
