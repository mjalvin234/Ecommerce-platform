import React, { useState, useEffect } from 'react';
import { X, Users, Package, DollarSign, TrendingUp, AlertTriangle, BarChart3, Clock, CheckCircle, XCircle, RefreshCw, CreditCard, Wallet } from 'lucide-react';
import { api } from '../api/client';
import { PaymentConfigPanel } from './PaymentConfigPanel';

interface AdminDashboardProps {
  onClose: () => void;
  showToast: (msg: string) => void;
  onOpenSettlementManagement?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, showToast, onOpenSettlementManagement }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'trends' | 'payment' | 'settlement'>('overview');
  const [loading, setLoading] = useState(false);

  // 统计数据
  const [stats, setStats] = useState<any>(null);
  const [orderTrend, setOrderTrend] = useState<any[]>([]);
  const [topModels, setTopModels] = useState<any[]>([]);

  // 用户列表
  const [users, setUsers] = useState<any[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userFilter, setUserFilter] = useState<{ role?: string; verificationStatus?: string }>({});

  useEffect(() => {
    loadData();
  }, [activeTab, userFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [statistics, trend, models] = await Promise.all([
          api.getAdminStatistics(),
          api.getOrderTrend(),
          api.getTopModels(10),
        ]);
        setStats(statistics);
        setOrderTrend(trend);
        setTopModels(models);
      } else if (activeTab === 'users') {
        const result = await api.getAdminUsers({
          ...userFilter,
          page: 1,
          pageSize: 50,
        });
        setUsers(result.items);
        setUserTotal(result.total);
      } else if (activeTab === 'trends') {
        const [trend, models] = await Promise.all([
          api.getOrderTrend(),
          api.getTopModels(10),
        ]);
        setOrderTrend(trend);
        setTopModels(models);
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      showToast('加载数据失败，请检查权限');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, data: { verificationStatus?: 'pending' | 'verified' | 'rejected'; creditScore?: number }) => {
    try {
      await api.updateUserStatus(userId, data);
      showToast('更新成功');
      loadData();
    } catch (err) {
      showToast('更新失败');
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            管理后台
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="刷新数据"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 标签栏 */}
        <div className="flex border-b border-gray-100 bg-gray-50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-shrink-0 px-5 py-3 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'text-blue-600 border-blue-600 bg-white'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            数据概览
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-shrink-0 px-5 py-3 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'users'
                ? 'text-blue-600 border-blue-600 bg-white'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            用户管理 {userTotal > 0 && `(${userTotal})`}
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-shrink-0 px-5 py-3 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'trends'
                ? 'text-blue-600 border-blue-600 bg-white'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            趋势分析
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex-shrink-0 px-5 py-3 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'payment'
                ? 'text-blue-600 border-blue-600 bg-white'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            支付设置
          </button>
          <button
            onClick={() => onOpenSettlementManagement?.()}
            className={`flex-shrink-0 px-5 py-3 text-sm font-bold transition-colors border-b-2 text-green-600 border-transparent hover:text-green-700 hover:bg-green-50`}
          >
            <Wallet className="w-4 h-4 inline mr-2" />
            结算审核
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* 数据概览 */}
              {activeTab === 'overview' && stats && (
                <div className="space-y-6">
                  {/* 核心指标卡片 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <Users className="w-4 h-4" />
                        <span className="text-xs font-bold">用户总数</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stats.users.total}</div>
                      <div className="text-xs text-gray-500 mt-1">今日新增: {stats.users.newToday}</div>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                      <div className="flex items-center gap-2 text-green-600 mb-2">
                        <Package className="w-4 h-4" />
                        <span className="text-xs font-bold">订单总数</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stats.orders.total}</div>
                      <div className="text-xs text-gray-500 mt-1">今日新增: {stats.orders.newToday}</div>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                      <div className="flex items-center gap-2 text-purple-600 mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs font-bold">交易总额</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{formatMoney(stats.transactions.totalAmount)}</div>
                      <div className="text-xs text-gray-500 mt-1">本月: {formatMoney(stats.transactions.monthAmount)}</div>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                      <div className="flex items-center gap-2 text-orange-600 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-bold">待处理</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.orders.pendingPayment + stats.orders.pendingShipment + stats.users.pendingVerification}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">待付款/发货/认证</div>
                    </div>
                  </div>

                  {/* 详细数据 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 用户分布 */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h4 className="font-bold text-gray-700 mb-4">用户分布</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">采购商</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${(stats.users.buyers / stats.users.total) * 100}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-sm">{stats.users.buyers}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">供应商</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${(stats.users.sellers / stats.users.total) * 100}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-sm">{stats.users.sellers}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">待认证</span>
                          <span className="font-mono font-bold text-sm text-orange-600">{stats.users.pendingVerification}</span>
                        </div>
                      </div>
                    </div>

                    {/* 订单状态 */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h4 className="font-bold text-gray-700 mb-4">订单状态</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">待付款</span>
                          <span className="font-mono font-bold text-sm text-red-600">{stats.orders.pendingPayment}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">待发货</span>
                          <span className="font-mono font-bold text-sm text-orange-600">{stats.orders.pendingShipment}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">已完成</span>
                          <span className="font-mono font-bold text-sm text-green-600">{stats.orders.completed}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 热门型号 */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="font-bold text-gray-700 mb-4">热门型号 TOP 10</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {topModels.map((model, index) => (
                        <div key={model.partNumber} className="bg-white rounded-lg p-2 border border-gray-100 text-center">
                          <div className="text-xs text-gray-400 mb-1">#{index + 1}</div>
                          <div className="font-mono text-sm font-bold truncate">{model.partNumber}</div>
                          <div className="text-xs text-gray-500">{model.count} 次</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 用户管理 */}
              {activeTab === 'users' && (
                <div>
                  {/* 筛选 */}
                  <div className="flex gap-2 mb-4">
                    <select
                      value={userFilter.role || ''}
                      onChange={(e) => setUserFilter({ ...userFilter, role: e.target.value || undefined })}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                    >
                      <option value="">全部角色</option>
                      <option value="buyer">采购商</option>
                      <option value="seller">供应商</option>
                    </select>
                    <select
                      value={userFilter.verificationStatus || ''}
                      onChange={(e) => setUserFilter({ ...userFilter, verificationStatus: e.target.value || undefined })}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                    >
                      <option value="">全部状态</option>
                      <option value="pending">待审核</option>
                      <option value="verified">已认证</option>
                      <option value="rejected">已拒绝</option>
                    </select>
                  </div>

                  {/* 用户列表 */}
                  {users.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">暂无用户数据</div>
                  ) : (
                    <div className="space-y-2">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              user.role === 'buyer' ? 'bg-blue-500' : 'bg-purple-500'
                            }`}>
                              {user.companyName?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.companyName}</div>
                              <div className="text-xs text-gray-500">
                                {user.email}
                                <span className="mx-2">·</span>
                                {user.role === 'buyer' ? '采购商' : '供应商'}
                                <span className="mx-2">·</span>
                                信用分: {user.creditScore}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {user.verificationStatus === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateUserStatus(user.id, { verificationStatus: 'verified' })}
                                  className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  通过
                                </button>
                                <button
                                  onClick={() => handleUpdateUserStatus(user.id, { verificationStatus: 'rejected' })}
                                  className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                                >
                                  <XCircle className="w-4 h-4" />
                                  拒绝
                                </button>
                              </>
                            )}
                            {user.verificationStatus === 'verified' && (
                              <span className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                已认证
                              </span>
                            )}
                            {user.verificationStatus === 'rejected' && (
                              <span className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                已拒绝
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 趋势分析 */}
              {activeTab === 'trends' && (
                <div className="space-y-6">
                  {/* 订单趋势 */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      近7天订单趋势
                    </h4>
                    <div className="flex items-end gap-2 h-32">
                      {orderTrend.map((day) => {
                        const maxCount = Math.max(...orderTrend.map(d => d.count), 1);
                        const height = (day.count / maxCount) * 100;
                        return (
                          <div key={day.date} className="flex-1 flex flex-col items-center">
                            <div className="w-full flex justify-center mb-1">
                              <span className="text-xs font-mono text-gray-600">{day.count}</span>
                            </div>
                            <div
                              className="w-full bg-blue-500 rounded-t transition-all"
                              style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                            />
                            <div className="text-xs text-gray-400 mt-1 font-mono">
                              {new Date(day.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 热门型号 */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="font-bold text-gray-700 mb-4">热门型号排行</h4>
                    <div className="space-y-2">
                      {topModels.map((model, index) => {
                        const maxCount = Math.max(...topModels.map(m => m.count), 1);
                        const width = (model.count / maxCount) * 100;
                        return (
                          <div key={model.partNumber} className="flex items-center gap-3">
                            <span className={`w-6 text-center font-bold text-sm ${
                              index < 3 ? 'text-orange-500' : 'text-gray-400'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="font-mono text-sm w-40 truncate">{model.partNumber}</span>
                            <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                            <span className="font-mono text-sm text-gray-600">{model.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 支付设置 */}
              {activeTab === 'payment' && (
                <PaymentConfigPanel showToast={showToast} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
