-- 添加缺失的表和字段
-- 请在 Cloudflare Dashboard > D1 > trading-center-db > Console 中执行

-- 1. 创建发票信息表
CREATE TABLE IF NOT EXISTS invoice_info (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  invoice_type TEXT DEFAULT 'normal',
  company_name TEXT NOT NULL,
  tax_number TEXT NOT NULL,
  bank_name TEXT,
  bank_account TEXT,
  address TEXT,
  phone TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 2. 更新 login_logs 表（添加缺失字段）
-- SQLite 不支持 ALTER TABLE ADD COLUMN IF NOT EXISTS，所以用安全方式
-- 如果字段已存在会报错，可以忽略

-- 添加 login_status 字段
ALTER TABLE login_logs ADD COLUMN login_status TEXT DEFAULT 'success';

-- 添加设备信息字段
ALTER TABLE login_logs ADD COLUMN device_type TEXT DEFAULT 'desktop';
ALTER TABLE login_logs ADD COLUMN os TEXT;
ALTER TABLE login_logs ADD COLUMN browser TEXT;
ALTER TABLE login_logs ADD COLUMN location TEXT;
ALTER TABLE login_logs ADD COLUMN fail_reason TEXT;

-- 3. 为 orders 添加更多字段（如果不存在）
ALTER TABLE orders ADD COLUMN buyer_address TEXT;
ALTER TABLE orders ADD COLUMN seller_address TEXT;

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_invoice_user ON invoice_info(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_status ON login_logs(login_status);
