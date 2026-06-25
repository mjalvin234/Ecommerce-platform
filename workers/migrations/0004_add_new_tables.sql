-- 添加新功能需要的表
-- 请在 Cloudflare Dashboard > D1 > trading-center-db > Console 中执行

-- 1. 管理员邮箱表
CREATE TABLE IF NOT EXISTS admin_emails (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  is_primary INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 2. 邮件模版表
CREATE TABLE IF NOT EXISTS email_templates (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  admin_subject TEXT,
  admin_body TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 3. 告警/通知表
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  title TEXT NOT NULL,
  content TEXT,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. 关注关系表
CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (following_id) REFERENCES users(id)
);

-- 5. 评价表
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  reviewer_id TEXT NOT NULL,
  reviewed_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  content TEXT,
  reply TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_id) REFERENCES users(id)
);

-- 6. 公告/新闻表
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'notice',
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 7. API Keys 表
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  api_key TEXT NOT NULL UNIQUE,
  secret_key TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  last_used_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 8. Webhooks 表
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  url TEXT NOT NULL,
  events TEXT,
  secret TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 9. 套餐表
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  items TEXT,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- 10. 阶梯价格表
CREATE TABLE IF NOT EXISTS tiered_prices (
  id TEXT PRIMARY KEY,
  inventory_id TEXT NOT NULL,
  min_quantity INTEGER NOT NULL,
  max_quantity INTEGER,
  price REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (inventory_id) REFERENCES inventory(id)
);

-- 11. 创建索引
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
CREATE INDEX IF NOT EXISTS idx_apikeys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_apikeys_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_packages_seller ON packages(seller_id);
CREATE INDEX IF NOT EXISTS idx_tieredprices_inventory ON tiered_prices(inventory_id);
