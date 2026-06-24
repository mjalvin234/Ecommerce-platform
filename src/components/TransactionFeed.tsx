import React, { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  orderNo: string;
  partNumber: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  buyerName: string;
  sellerName: string;
}

export const TransactionFeed: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // 获取最近的交易记录
      const response = await fetch('http://localhost:3001/api/orders/recent-transactions?limit=10');

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      // 使用模拟数据
      setTransactions([
        { id: '1', orderNo: 'ORD-001', partNumber: 'STM32F103C8T6', quantity: 1000, totalPrice: 10450, status: 'completed', createdAt: new Date().toISOString(), buyerName: 'BYR-****', sellerName: 'SLR-****' },
        { id: '2', orderNo: 'ORD-002', partNumber: 'ESP32-WROOM-32E', quantity: 500, totalPrice: 7250, status: 'completed', createdAt: new Date(Date.now() - 3600000).toISOString(), buyerName: 'BYR-****', sellerName: 'SLR-****' },
        { id: '3', orderNo: 'ORD-003', partNumber: 'XC7Z020-2CLG400I', quantity: 50, totalPrice: 42500, status: 'completed', createdAt: new Date(Date.now() - 7200000).toISOString(), buyerName: 'BYR-****', sellerName: 'SLR-****' },
        { id: '4', orderNo: 'ORD-004', partNumber: 'ATMEGA328P-AU', quantity: 2000, totalPrice: 24000, status: 'shipped', createdAt: new Date(Date.now() - 10800000).toISOString(), buyerName: 'BYR-****', sellerName: 'SLR-****' },
        { id: '5', orderNo: 'ORD-005', partNumber: 'NE555DR', quantity: 10000, totalPrice: 2500, status: 'completed', createdAt: new Date(Date.now() - 14400000).toISOString(), buyerName: 'BYR-****', sellerName: 'SLR-****' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `¥${(price / 10000).toFixed(1)}万`;
    }
    return `¥${price.toLocaleString()}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span className="text-lg">📈</span>
          最新成交
        </h3>
        <span className="text-xs text-gray-400">实时更新</span>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-500">加载中...</div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx, index) => (
            <div
              key={tx.id}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                {/* 排名 */}
                <span className={`w-6 h-6 flex items-center justify-center text-xs rounded-full ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-100 text-gray-600' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'text-gray-400'
                }`}>
                  {index + 1}
                </span>

                {/* 型号 */}
                <div>
                  <p className="font-medium text-gray-900 text-sm">{tx.partNumber}</p>
                  <p className="text-xs text-gray-500">
                    {tx.quantity} 件 · {tx.buyerName} → {tx.sellerName}
                  </p>
                </div>
              </div>

              {/* 价格和时间 */}
              <div className="text-right">
                <p className="font-bold text-blue-600">{formatPrice(tx.totalPrice)}</p>
                <p className="text-xs text-gray-400">{formatTime(tx.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 统计信息 */}
      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xl font-bold text-blue-600">128</p>
          <p className="text-xs text-gray-500">今日成交</p>
        </div>
        <div>
          <p className="text-xl font-bold text-green-600">¥52.3万</p>
          <p className="text-xs text-gray-500">今日金额</p>
        </div>
        <div>
          <p className="text-xl font-bold text-purple-600">1,234</p>
          <p className="text-xs text-gray-500">在线用户</p>
        </div>
      </div>
    </div>
  );
};

export default TransactionFeed;
