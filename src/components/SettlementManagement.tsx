import React, { useState, useEffect } from 'react';
import {
  X, DollarSign, Users, Clock, AlertTriangle, CheckCircle2,
  RefreshCcw, FileText, Loader2, Play, RotateCw, Building2, Smartphone
} from 'lucide-react';
import { api } from '../api/client';
import type { PendingSettlement, SettlementStatus } from '../types/settlement';

interface SettlementManagementProps {
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

export const SettlementManagement: React.FC<SettlementManagementProps> = ({ onClose, showToast }) => {
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<PendingSettlement[]>([]);
  const [stats, setStats] = useState({
    todayAmount: 0,
    pendingCount: 0,
    processingCount: 0,
    completedCount: 0,
    failedCount: 0,
    monthAmount: 0,
  });
  const [detailSettlement, setDetailSettlement] = useState<PendingSettlement | null>(null);
  const [processModal, setProcessModal] = useState<PendingSettlement | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settlementsRes, statsRes] = await Promise.all([
        api.getPendingSettlements(),
        api.getSettlementStats(),
      ]);
      setSettlements(settlementsRes);
      setStats(statsRes);
    } catch (err: any) {
      showToast(err.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (settlementId: string) => {
    setProcessing(true);
    try {
      const result = await api.processSettlement(settlementId);
      if (result.success) {
        showToast('结算处理成功');
        setProcessModal(null);
        await loadData();
      }
    } catch (err: any) {
      showToast(err.message || '处理失败');
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = async (settlementId: string) => {
    try {
      const result = await api.retrySettlement(settlementId);
      if (result.success) {
        showToast('重试成功');
        await loadData();
      }
    } catch (err: any) {
      showToast(err.message || '重试失败');
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

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            结算审核管理
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="刷新数据"
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
          <div className="grid grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl font-bold text-blue-600">{formatMoney(stats.todayAmount)}</div>
              <div className="text-xs text-gray-500 mt-1">今日结算金额</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl font-bold text-purple-600">{formatMoney(stats.monthAmount)}</div>
              <div className="text-xs text-gray-500 mt-1">本月结算金额</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
              <div className="text-xs text-gray-500 mt-1">待处理</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.processingCount}</div>
              <div className="text-xs text-gray-500 mt-1">处理中</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedCount}</div>
              <div className="text-xs text-gray-500 mt-1">已完成</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failedCount}</div>
              <div className="text-xs text-gray-500 mt-1">失败</div>
            </div>
          </div>
        </div>

        {/* 列表区 */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-300 mb-3" />
              <p>暂无待处理的结算</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">结算单号</th>
                  <th className="px-6 py-3">卖家信息</th>
                  <th className="px-6 py-3">订单号</th>
                  <th className="px-6 py-3 text-right">金额</th>
                  <th className="px-6 py-3">收款方式</th>
                  <th className="px-6 py-3">状态</th>
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
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {settlement.seller.companyName}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          {settlement.paymentMethod === 'alipay' && settlement.seller.alipayAccount && (
                            <>
                              <Smartphone className="w-3 h-3" />
                              {settlement.seller.alipayAccount}
                            </>
                          )}
                          {settlement.paymentMethod === 'bank' && settlement.seller.bankName && (
                            <>
                              <Building2 className="w-3 h-3" />
                              {settlement.seller.bankName} {settlement.seller.bankAccount}
                            </>
                          )}
                          {settlement.paymentMethod === 'wechat' && (
                            <>
                              <Smartphone className="w-3 h-3" />
                              微信企业付款
                            </>
                          )}
                        </div>
                      </div>
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
                      <span className="text-sm text-gray-600">
                        {settlement.paymentMethod === 'wechat' ? '微信' :
                         settlement.paymentMethod === 'alipay' ? '支付宝' : '银行转账'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={settlement.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {formatDate(settlement.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setDetailSettlement(settlement)}
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          详情
                        </button>
                        {settlement.status === 'pending' && (
                          <button
                            onClick={() => setProcessModal(settlement)}
                            className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                          >
                            <Play className="w-3.5 h-3.5" />
                            处理
                          </button>
                        )}
                        {settlement.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(settlement.id)}
                            className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            重试
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 详情弹窗 */}
      {detailSettlement && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
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

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-bold mb-2">卖家信息</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">公司名称</span>
                    <span className="font-medium">{detailSettlement.seller.companyName}</span>
                  </div>
                  {detailSettlement.seller.alipayAccount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">支付宝账号</span>
                      <span className="font-mono">{detailSettlement.seller.alipayAccount}</span>
                    </div>
                  )}
                  {detailSettlement.seller.bankName && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">开户银行</span>
                        <span className="font-mono">{detailSettlement.seller.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">银行账号</span>
                        <span className="font-mono">{detailSettlement.seller.bankAccount}</span>
                      </div>
                    </>
                  )}
                </div>
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

              <div>
                <div className="text-xs text-gray-500 mb-1">创建时间</div>
                <div className="text-sm text-gray-600">{formatDate(detailSettlement.createdAt)}</div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setDetailSettlement(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
              {detailSettlement.status === 'pending' && (
                <button
                  onClick={() => {
                    setDetailSettlement(null);
                    setProcessModal(detailSettlement);
                  }}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
                >
                  处理结算
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 处理结算确认弹窗 */}
      {processModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-green-50">
              <h3 className="font-bold text-lg text-green-800 flex items-center gap-2">
                <Play className="w-5 h-5" />
                确认处理结算
              </h3>
              <button onClick={() => setProcessModal(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">结算单号</span>
                  <span className="font-mono font-medium">{processModal.settlementNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">卖家</span>
                  <span className="font-medium">{processModal.seller.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">订单号</span>
                  <span className="font-mono">{processModal.orderNumber}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-gray-700 font-bold">结算金额</span>
                  <span className="font-mono font-bold text-xl text-red-600">
                    {formatMoney(processModal.amount)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-800 font-bold mb-2">收款账户信息</div>
                <div className="text-sm text-blue-700">
                  {processModal.paymentMethod === 'wechat' && (
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      微信企业付款
                    </div>
                  )}
                  {processModal.paymentMethod === 'alipay' && processModal.seller.alipayAccount && (
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      支付宝: {processModal.seller.alipayAccount}
                    </div>
                  )}
                  {processModal.paymentMethod === 'bank' && processModal.seller.bankName && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {processModal.seller.bankName}
                      </div>
                      <div className="font-mono text-xs">{processModal.seller.bankAccount}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                确认后系统将自动打款至卖家收款账户
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setProcessModal(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleProcess(processModal.id)}
                disabled={processing}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    确认处理
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettlementManagement;
