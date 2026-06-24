#!/bin/bash

# Trading Center Workers 快速部署脚本

echo "🚀 开始部署 Trading Center Workers..."
echo ""

# 检查是否已安装 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ 未安装 wrangler，正在安装..."
    npm install -g wrangler
fi

# 检查是否已登录
echo "📋 检查登录状态..."
wrangler whoami

if [ $? -ne 0 ]; then
    echo ""
    echo "🔐 需要登录 Cloudflare..."
    wrangler login
fi

echo ""
echo "📦 安装依赖..."
npm install

echo ""
echo "🗄️  创建 D1 数据库..."
wrangler d1 create trading-center-db

echo ""
echo "💾 创建 R2 存储桶..."
wrangler r2 bucket create trading-center-uploads

echo ""
echo "⚙️  配置环境变量..."
echo "请输入 JWT_SECRET（至少32位随机字符串）："
read -s JWT_SECRET
wrangler secret put JWT_SECRET <<< "$JWT_SECRET"

echo ""
echo "请输入 ENCRYPTION_KEY（至少16位随机字符串）："
read -s ENCRYPTION_KEY
wrangler secret put ENCRYPTION_KEY <<< "$ENCRYPTION_KEY"

echo ""
echo "🔧 执行数据库迁移..."
wrangler d1 migrations apply trading-center-db

echo ""
echo "🚀 部署 Workers..."
npm run deploy

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 下一步："
echo "1. 记录返回的 Workers URL"
echo "2. 更新前端 API 配置"
echo "3. 更新 wrangler.toml 中的 database_id"
echo "4. 测试 API 是否正常"
