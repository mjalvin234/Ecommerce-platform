-- 迁移：更新数据库结构以支持新功能
-- 执行日期：2025-06-25

-- 1. 更新 inventory 表，添加新字段
ALTER TABLE inventory ADD COLUMN part_number TEXT;
ALTER TABLE inventory ADD COLUMN available_qty INTEGER;
ALTER TABLE inventory ADD COLUMN year TEXT;
ALTER TABLE inventory ADD COLUMN eccn TEXT;
ALTER TABLE inventory ADD COLUMN lead_time TEXT;

-- 更新现有数据
UPDATE inventory SET available_qty = quantity WHERE available_qty IS NULL;
UPDATE inventory SET part_number = 'PART-' || substr(id, 1, 8) WHERE part_number IS NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_inventory_part_number ON inventory(part_number);

-- 2. 创建议价表
CREATE TABLE IF NOT EXISTS negotiations (
  id TEXT PRIMARY KEY,
  inventory_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  seller_price REAL NOT NULL,
  offer_price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (inventory_id) REFERENCES inventory(id),
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_negotiations_buyer ON negotiations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_seller ON negotiations(seller_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON negotiations(status);

-- 3. 更新 orders 表，添加新字段
ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'direct' CHECK(order_type IN ('direct', 'negotiated'));
ALTER TABLE orders ADD COLUMN part_number TEXT;
ALTER TABLE orders ADD COLUMN inventory_id TEXT;

-- 4. 更新 messages 表结构
-- SQLite 不支持 DROP COLUMN，我们需要重建表
CREATE TABLE IF NOT EXISTS messages_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('order', 'negotiation', 'system')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  related_data TEXT,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 迁移旧数据（如果有的话）
INSERT OR IGNORE INTO messages_new (id, user_id, type, category, title, content, read, created_at)
SELECT id, receiver_id, 'system', 'system', '消息', content,
  CASE WHEN read_at IS NOT NULL THEN 1 ELSE 0 END, created_at
FROM messages;

-- 删除旧表，重命名新表
DROP TABLE messages;
ALTER TABLE messages_new RENAME TO messages;

CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_category ON messages(category);
