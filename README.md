# 芯核交易中心

B2B 电子元器件交易平台（React + Express + SQLite）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Tailwind CSS |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | SQLite（零配置） |
| 认证 | JWT Token |

---

## 启动步骤

### 第一步：安装依赖（只需一次）

```bash
cd /trading-center
npm install
```

### 第二步：启动后端（终端 1）

```bash
cd /trading-center
npm run server:dev
```

看到以下信息表示成功：
```
🚀 服务器已启动: http://localhost:3001
📝 测试账号: buyer@test.com / seller@test.com
🔑 密码: Test1234
```

### 第三步：启动前端（终端 2）

```bash
cd /trading-center
npm run dev
```

浏览器打开 http://localhost:3000

---

## 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 买家 | buyer@test.com | Test1234 |
| 卖家 | seller@test.com | Test1234 |
| 管理员 | admin@test.com | Test1234 |

---

## 目录结构

```
交易中心/
├── src/                  # 前端代码
│   ├── api/              # API 客户端
│   ├── hooks/            # React Hooks
│   └── App.tsx           # 主组件
├── server/               # 后端代码
│   ├── src/
│   │   ├── models/       # 数据模型
│   │   ├── services/     # 业务逻辑
│   │   ├── controllers/  # API 控制器
│   │   └── app.ts        # 入口
│   └── data/             # SQLite 数据库文件
└── package.json
```

---

## API 接口

| 模块 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 认证 | POST | `/api/auth/login` | 登录 |
| 认证 | POST | `/api/auth/register` | 注册 |
| 库存 | GET | `/api/inventory` | 搜索库存 |
| 库存 | POST | `/api/inventory` | 发布库存 |
| 订单 | POST | `/api/orders` | 创建订单 |
| 订单 | POST | `/api/orders/:id/pay` | 支付 |
| 订单 | POST | `/api/orders/:id/ship` | 发货 |

---

## 常用命令

```bash
npm run dev          # 启动前端
npm run server:dev   # 启动后端
npm run db:reset     # 重置数据库
```

---

## 停止服务

### 前台运行的服务

在运行服务的终端中按 **`Ctrl + C`** 停止。

### 后台运行的服务

如果服务在后台运行，使用以下命令：

```bash
# 查看占用端口的进程
lsof -i :3001    # 后端端口
lsof -i :3000    # 前端端口

# 停止进程（将 PID 替换为实际进程号）
kill -9 <PID>

# 或一键停止所有 Node 进程
pkill -f node
```

### 一键停止脚本

```bash
# 停止后端
pkill -f "node.*server"

# 停止前端
pkill -f "vite"
```
