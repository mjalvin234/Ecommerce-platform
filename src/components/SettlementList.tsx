import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle2, AlertTriangle, Loader2, Filter, RefreshCcw, FileText, DollarSign } from 'lucide-react';
import { api } from '../api/client';
import type { Settlement, SettlementStatus } from '../types/settlement';

interface SettlementListProps {
  onClose: () => void;
  showToast: (msg: string) => void;
}

// 状态标签组件
const StatusBadge: React.FC<{ status: SettlementStatus }> = ({ status }) => {
  const config = {
    pending: { label: '待处理', color: 'yellow', icon: Clock },
    processing: { label: '处理中', color: 'blue', icon: Loader2 },
    completed: { label: '已完成', color: 'green', icon: CheckCircle2 },
    failed: { label: '失败', color: 'red', icon: AlertTriangle },
  };

  const { label, color, icon: Icon } = config[status];
  const colorClasses = {
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colorClasses[color]}`}>
      <Icon className={`w-3.5 h-3.5 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {label}
    </span>
  );
};

export const SettlementList: React.FC<SettlementListProps> = ({ onClose, showToast }) => {
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SettlementStatus | ''>('');
  const [detailSettlement, setDetailSettlement] = useState<Settlement | null>(null);

  useEffect(() => {
    loadSettlements();
  }, [page, statusFilter]);

  const loadSettlements = async () => {
    setLoading(true);
    try {
      const result = await api.getSellerSettlements({
        status: statusFilter || undefined,
        page,
        pageSize: 10,
      });
      setSettlements(result.items);
      setTotal(result.total);
    } catch (err: any) {
      showToast(err.message || '加载结算记录失败');
    } finally {
      setLoading(false);
    }
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

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(amount);
  };

  // 统计信息
  const stats = {
    total: settlements.length,
    pending: settlements.filter(s => s.status === 'pending').length,
    completed: settlements.filter(s => s.status === 'completed').length,
    totalAmount: settlements.reduce((sum, s) => sum + (s.status === 'completed' ? s.amount : 0), 0),
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            结算记录
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSettlements}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="刷新"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-xs text-gray-500 mt-1">总记录数</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-gray-500 mt-1">待处理</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs text-gray-500 mt-1">已完成</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl font-bold text-blue-600">{formatMoney(stats.totalAmount)}</div>
              <div className="text-xs text-gray-500 mt-1">累计结算金额</div>
            </div>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">状态筛选：</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                statusFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                statusFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              待处理
            </button>
            <button
              onClick={() => setStatusFilter('processing')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                statusFilter === 'processing' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              处理中
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                statusFilter === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              已完成
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                statusFilter === 'failed' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              失败
            </button>
          </div>
        </div>

        {/* 列表区 */}
        <div className="overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>暂无结算记录</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">结算单号</th>
                  <th className="px-6 py-3">订单号</th>
                  <th className="px-6 py-3 text-right">金额</th>
                  <th className="px-6 py-3">状态</th>
                  <th className="px-6 py-3">收款方式</th>
                  <th className="px-6 py-3">时间</th>
                  <th className="px-6 py-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {settlement.settlementNo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-600">
                        {settlement.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono font-bold text-lg text-red-600">
                        {formatMoney(settlement.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={settlement.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {settlement.paymentMethod === 'wechat' ? '微信' :
                         settlement.paymentMethod === 'alipay' ? '支付宝' : '银行转账'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {formatDate(settlement.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setDetailSettlement(settlement)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 分页 */}
        {total > 10 && (
          <div className="p-4 border-t border-gray-100 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              共 {total} 条记录
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                第 {page} 页
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={settlements.length < 10}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {detailSettlement && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg">结算详情</h3>
              <button onClick={() => setDetailSettlement(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">结算单号</div>
                <div className="font-mono font-bold text-lg">{detailSettlement.settlementNo}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">订单号</div>
                  <div className="font-mono text-sm">{detailSettlement.orderNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">结算金额</div>
                  <div className="font-mono font-bold text-lg text-red-600">
                    {formatMoney(detailSettlement.amount)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">收款方式</div>
                  <div className="text-sm">
                    {detailSettlement.paymentMethod === 'wechat' ? '微信企业付款' :
                     detailSettlement.paymentMethod === 'alipay' ? '支付宝转账' : '银行转账'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">状态</div>
                  <StatusBadge status={detailSettlement.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">创建时间</div>
                  <div className="text-sm text-gray-600">{formatDate(detailSettlement.createdAt)}</div>
                </div>
                {detailSettlement.processedAt && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">处理时间</div>
                    <div className="text-sm text-gray-600">{formatDate(detailSettlement.processedAt)}</div>
                  </div>
                )}
              </div>

              {detailSettlement.status === 'failed' && detailSettlement.failureReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-xs text-red-600 font-bold mb-1">失败原因</div>
                  <div className="text-sm text-red-700">{detailSettlement.failureReason}</div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setDetailSettlement(null)}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettlementList;
