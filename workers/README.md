# Trading Center Workers 部署指南

## 📋 前置要求

1. **Cloudflare 账号**（免费即可）
   - 注册地址：https://dash.cloudflare.com/sign-up

2. **安装依赖**
   ```bash
   cd workers
   npm install
   ```

3. **安装 Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

---

## 🚀 部署步骤

### 第一步：登录 Cloudflare

```bash
wrangler login
```

浏览器会打开授权页面，点击允许授权。

---

### 第二步：创建 D1 数据库

```bash
# 创建数据库
wrangler d1 create trading-center-db

# 记录返回的 database_id，类似：
# ✅ Successfully created DB 'trading-center-db'
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

将返回的 `database_id` 更新到 `wrangler.toml` 文件中：

```toml
[[d1_databases]]
binding = "DB"
database_name = "trading-center-db"
database_id = "你的database_id"  # ← 修改这里
```

---

### 第三步：创建 R2 存储桶

```bash
# 创建 R2 存储桶（用于文件上传）
wrangler r2 bucket create trading-center-uploads
```

---

### 第四步：配置环境变量

设置敏感环境变量（不会出现在代码中）：

```bash
# JWT 密钥（必须设置）
wrangler secret put JWT_SECRET
# 输入：至少32位的随机字符串

# 加密密钥
wrangler secret put ENCRYPTION_KEY
# 输入：至少16位的随机字符串

# 管理员账号（可选）
wrangler secret put ADMIN_EMAIL
wrangler secret put ADMIN_PASSWORD
wrangler secret put ADMIN_NAME
```

---

### 第五步：初始化数据库

```bash
# 执行数据库迁移
wrangler d1 migrations apply trading-center-db

# 如果需要导入现有数据，先运行导出脚本
cd ..
npm run db:export
cd workers
wrangler d1 migrations apply trading-center-db
```

---

### 第六步：部署 Workers

```bash
# 部署到 Cloudflare
npm run deploy

# 部署成功后会返回 URL，类似：
# ✨ Successfully published your script to
#    https://trading-center-api.your-subdomain.workers.dev
```

---

## 🔧 配置前端

### 1. 更新前端 API 地址

修改前端项目中的 API 配置：

```typescript
// src/config/api.ts
const API_BASE_URL = import.meta.env.PROD
  ? 'https://your-workers-url.workers.dev'  // ← 改为你的 Workers URL
  : 'http://localhost:8787';
```

### 2. 更新 CORS 配置

修改 `workers/src/index.ts` 中的 CORS 配置：

```typescript
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'https://your-username.github.io',  // ← 添加你的 GitHub Pages 地址
  ],
  // ...
}));
```

### 3. 更新 wrangler.toml

在 `wrangler.toml` 中添加你的前端域名：

```toml
[vars]
FRONTEND_URL = "https://your-username.github.io/Ecommerce-platform/"
```

---

## 🧪 本地测试

```bash
# 启动本地开发服务器
npm run dev

# 访问 http://localhost:8787
```

---

## 📊 查看日志

```bash
# 实时查看日志
npm run tail
```

---

## 💰 免费额度

| 服务 | 免费额度 |
|------|---------|
| Workers 请求 | 10万次/天 |
| D1 数据库 | 5GB 存储，500万行读取/天 |
| R2 存储 | 10GB 存储 |

---

## 🔗 有用链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Hono 框架文档](https://hono.dev/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [R2 存储文档](https://developers.cloudflare.com/r2/)

---

## ❓ 常见问题

### 1. 部署失败：authentication error

```bash
# 重新登录
wrangler logout
wrangler login
```

### 2. 数据库连接失败

检查 `wrangler.toml` 中的 `database_id` 是否正确。

### 3. CORS 错误

确保前端域名已添加到 CORS 配置中。

### 4. JWT_SECRET 未设置

```bash
wrangler secret put JWT_SECRET
```

---

## 📝 下一步

1. 部署成功后，测试 API 是否正常
2. 更新前端代码，修改 API 地址
3. 重新构建并部署前端到 GitHub Pages
4. 测试完整功能
