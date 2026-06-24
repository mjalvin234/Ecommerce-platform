# @trading-center/sdk

交易中心 API JavaScript/TypeScript SDK

## 安装

```bash
npm install @trading-center/sdk
# 或
yarn add @trading-center/sdk
# 或
pnpm add @trading-center/sdk
```

## 快速开始

```typescript
import { TradingCenter } from '@trading-center/sdk';

// 创建客户端
const client = new TradingCenter({
  apiKey: 'tc_your_api_key',
  apiSecret: 'your_api_secret',
  baseURL: 'https://api.trading-center.com/api' // 可选
});

// 测试连接
const isConnected = await client.ping();
console.log('Connected:', isConnected);
```

## 使用示例

### 搜索库存

```typescript
// 关键字搜索
const result = await client.inventory.search({
  keyword: 'STM32',
  page: 1,
  pageSize: 20
});

console.log(`找到 ${result.total} 条记录`);
result.items.forEach(inv => {
  console.log(`${inv.partNumber} - ¥${inv.price} x ${inv.quantity}`);
});
```

### 创建订单

```typescript
// 直接下单
const order = await client.orders.create({
  inventoryId: 'inv-xxx',
  quantity: 100
});

console.log(`订单创建成功: ${order.orderNumber}`);
```

### 支付订单

```typescript
// 发起支付
const payment = await client.orders.pay(order.id, 'alipay');
console.log(`支付链接: ${payment.payUrl}`);
```

### 发布库存（卖家）

```typescript
const inventory = await client.inventory.create({
  partNumber: 'STM32F103C8T6',
  brand: 'ST',
  quantity: 1000,
  price: 5.50,
  year: '2023',
  leadTime: '3-5天'
});

console.log(`库存发布成功: ${inventory.id}`);
```

## API 参考

### TradingCenter

主客户端类。

#### 构造函数

```typescript
new TradingCenter({
  apiKey: string;      // API密钥（必需）
  apiSecret: string;   // API密钥密文（必需）
  baseURL?: string;    // API地址（可选）
  timeout?: number;    // 超时时间（可选，默认30000ms）
})
```

#### 方法

- `ping()` - 测试连接
- `getStats()` - 获取API使用统计

### InventoryAPI

`client.inventory` 提供库存相关操作。

| 方法 | 说明 |
|------|------|
| `search(options)` | 搜索库存 |
| `get(id)` | 获取库存详情 |
| `create(data)` | 发布库存 |
| `update(id, data)` | 更新库存 |
| `delete(id)` | 删除库存 |

### OrderAPI

`client.orders` 提供订单相关操作。

| 方法 | 说明 |
|------|------|
| `create(options)` | 创建订单 |
| `list(options)` | 获取订单列表 |
| `get(id)` | 获取订单详情 |
| `pay(id, channel)` | 支付订单 |
| `cancel(id, reason)` | 取消订单 |
| `confirm(id)` | 确认收货 |

### SearchAPI

`client.search` 提供搜索相关操作。

| 方法 | 说明 |
|------|------|
| `inventory(keyword, options)` | 搜索库存 |
| `hotKeywords(limit)` | 获取热门关键词 |
| `similar(partNumber, limit)` | 获取相似型号 |

## 错误处理

```typescript
try {
  const order = await client.orders.create({
    inventoryId: 'invalid-id',
    quantity: 100
  });
} catch (error) {
  console.error('创建订单失败:', error.message);
}
```

## TypeScript 支持

本SDK使用TypeScript编写，提供完整的类型定义。

```typescript
import type { Inventory, Order, SearchResult } from '@trading-center/sdk';
```

## License

MIT
