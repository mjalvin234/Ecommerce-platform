import React, { useState, useEffect } from 'react';

interface Negotiation {
  id: string;
  inventoryId: string;
  inventoryPartNumber: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  originalPrice: number;
  proposedPrice: number;
  quantity: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  message?: string;
  response?: string;
  createdAt: string;
  respondedAt?: string;
}

export const NegotiationHistory: React.FC<{ role: 'buyer' | 'seller' }> = ({ role }) => {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchNegotiations();
  }, [statusFilter]);

  const fetchNegotiations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(
        `http://localhost:3001/api/negotiations/history?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNegotiations(data.negotiations || []);
      }
    } catch (error) {
      console.error('获取议价历史失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      pending: '待回复',
      accepted: '已接受',
      rejected: '已拒绝',
      expired: '已过期',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDiscount = (original: number, proposed: number) => {
    const discount = ((original - proposed) / original) * 100;
    return discount.toFixed(1);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">议价历史</h2>
      </div>

      {/* 状态筛选 */}
      <div className="p-4 border-b border-gray-200 flex gap-2">
        {['all', 'pending', 'accepted', 'rejected', 'expired'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? '全部' :
             status === 'pending' ? '待回复' :
             status === 'accepted' ? '已接受' :
             status === 'rejected' ? '已拒绝' : '已过期'}
          </button>
        ))}
      </div>

      {/* 列表 */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : negotiations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无议价记录</div>
        ) : (
          negotiations.map((negotiation) => (
            <div key={negotiation.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 型号和状态 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {negotiation.inventoryPartNumber}
                    </span>
                    {getStatusBadge(negotiation.status)}
                  </div>

                  {/* 价格信息 */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>原价: ¥{negotiation.originalPrice.toFixed(2)}</span>
                    <span className="text-blue-600 font-medium">
                      议价: ¥{negotiation.proposedPrice.toFixed(2)}
                    </span>
                    <span className="text-green-600">
                      ({calculateDiscount(negotiation.originalPrice, negotiation.proposedPrice)}% off)
                    </span>
                    <span>× {negotiation.quantity} 件</span>
                  </div>

                  {/* 消息 */}
                  {negotiation.message && (
                    <p className="text-sm text-gray-500 mb-1">
                      留言: {negotiation.message}
                    </p>
                  )}
                  {negotiation.response && (
                    <p className="text-sm text-gray-500">
                      回复: {negotiation.response}
                    </p>
                  )}
                </div>

                {/* 时间和金额 */}
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ¥{(negotiation.proposedPrice * negotiation.quantity).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(negotiation.createdAt)}
                  </p>
                  {negotiation.respondedAt && (
                    <p className="text-xs text-gray-400">
                      回复于 {formatDate(negotiation.respondedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NegotiationHistory;
