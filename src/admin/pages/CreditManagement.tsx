/**
 * 信用分管理页面 - 现代化改造版
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  X,
  Award,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { api } from '../../api/client';
import { DataTable, Column, KPICard } from '../../components/admin-ui';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface User {
  id: string;
  email: string;
  companyName: string;
  role: 'buyer' | 'seller' | 'admin';
  creditScore: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

interface CreditManagementProps {
  showToast: (msg: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const CreditManagement: React.FC<CreditManagementProps> = ({ showToast }) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getAdminUsers({ page: 1, pageSize: 50 });
      setUsers(result.items);
      setTotal(result.total);
    } catch (err) {
      console.error('加载用户失败:', err);
      showToast('加载用户失败');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 调整信用分
  const handleAdjust = async () => {
    if (!selectedUser || adjustAmount <= 0) {
      showToast('请输入有效的调整分数');
      return;
    }
    if (!adjustReason.trim()) {
      showToast('请填写调整原因');
      return;
    }

    try {
      const newScore =
        adjustType === 'add'
          ? selectedUser.creditScore + adjustAmount
          : Math.max(0, selectedUser.creditScore - adjustAmount);

      await api.updateUserStatus(selectedUser.id, { creditScore: newScore });
      showToast(`信用分已${adjustType === 'add' ? '增加' : '扣除'} ${adjustAmount} 分`);
      closeModal();
      loadData();
    } catch (err) {
      showToast('操作失败');
    }
  };

  // 打开弹窗
  const openModal = (user: User) => {
    setSelectedUser(user);
    setAdjustType('add');
    setAdjustAmount(0);
    setAdjustReason('');
  };

  // 关闭弹窗
  const closeModal = () => {
    setSelectedUser(null);
    setAdjustAmount(0);
    setAdjustReason('');
  };

  // 筛选用户
  const filteredUsers = searchEmail
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
          u.companyName.toLowerCase().includes(searchEmail.toLowerCase())
      )
    : users;

  // 统计数据
  const stats = {
    excellent: users.filter((u) => u.creditScore >= 80).length,
    good: users.filter((u) => u.creditScore >= 60 && u.creditScore < 80).length,
    poor: users.filter((u) => u.creditScore < 60).length,
    avgScore: users.length > 0 ? Math.round(users.reduce((sum, u) => sum + u.creditScore, 0) / users.length) : 0,
  };

  // 表格列定义
  const columns: Column<User>[] = [
    {
      key: 'user',
      title: '用户',
      render: (_, user) => (
        <div className="min-w-0">
          <div className="font-medium text-gray-900 truncate">{user.companyName}</div>
          <div className="text-xs text-gray-500 truncate">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      title: '角色',
      width: 100,
      render: (_, user) => (
        <span
          className={`admin-badge ${
            user.role === 'buyer'
              ? 'bg-blue-50 text-blue-700'
              : user.role === 'seller'
              ? 'bg-purple-50 text-purple-700'
              : 'bg-gray-50 text-gray-700'
          }`}
        >
          {user.role === 'buyer' ? '采购商' : user.role === 'seller' ? '供应商' : '管理员'}
        </span>
      ),
    },
    {
      key: 'creditScore',
      title: '信用分',
      width: 100,
      align: 'center',
      sortable: true,
      render: (_, user) => (
        <div className="flex items-center justify-center gap-2">
          <Star
            className={`w-4 h-4 ${
              user.creditScore >= 80
                ? 'text-green-500'
                : user.creditScore >= 60
                ? 'text-yellow-500'
                : 'text-red-500'
            }`}
          />
          <span className="font-mono font-semibold">{user.creditScore}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (_, user) => {
        const statusMap = {
          verified: { text: '已认证', className: 'admin-badge-success' },
          pending: { text: '待审核', className: 'admin-badge-warning' },
          rejected: { text: '已拒绝', className: 'admin-badge-error' },
        };
        const status = statusMap[user.verificationStatus];
        return <span className={`admin-badge ${status.className}`}>{status.text}</span>;
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: 100,
      align: 'right',
      render: (_, user) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openModal(user);
          }}
          className="admin-btn admin-btn-primary text-sm py-1.5"
        >
          调整分数
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">信用分管理</h1>
          <p className="text-gray-500 mt-1 text-sm">调整用户信用分数，共 {total} 位用户</p>
        </div>
        <button onClick={loadData} disabled={loading} className="admin-btn admin-btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* KPI 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="优秀用户"
          value={stats.excellent.toLocaleString()}
          icon={<Award className="w-5 h-5" />}
          color="green"
          subtitle="信用分 ≥ 80"
        />
        <KPICard
          title="良好用户"
          value={stats.good.toLocaleString()}
          icon={<CheckCircle className="w-5 h-5" />}
          color="blue"
          subtitle="信用分 60-79"
        />
        <KPICard
          title="风险用户"
          value={stats.poor.toLocaleString()}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
          subtitle="信用分 < 60"
        />
        <KPICard
          title="平均分"
          value={stats.avgScore.toString()}
          icon={<Star className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* 搜索栏 */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="搜索用户邮箱或企业名称..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 数据表格 */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyText="未找到匹配的用户"
      />

      {/* 调整分数弹窗 */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">调整信用分</h3>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 内容 */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="font-medium text-gray-900">{selectedUser.companyName}</div>
                  <div className="text-sm text-gray-500">当前: {selectedUser.creditScore} 分</div>
                </div>

                {/* 调整类型 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustType('add')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      adjustType === 'add'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    增加
                  </button>
                  <button
                    onClick={() => setAdjustType('subtract')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      adjustType === 'subtract'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    扣除
                  </button>
                </div>

                {/* 调整分数 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">调整分数</label>
                  <input
                    type="number"
                    value={adjustAmount || ''}
                    onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                    className="admin-input"
                    placeholder="输入分数"
                    min={1}
                  />
                </div>

                {/* 预览结果 */}
                {adjustAmount > 0 && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="text-xs text-blue-600 mb-1">调整后分数</div>
                    <div className="font-mono font-bold text-2xl text-blue-700">
                      {adjustType === 'add'
                        ? selectedUser.creditScore + adjustAmount
                        : Math.max(0, selectedUser.creditScore - adjustAmount)}
                    </div>
                  </div>
                )}

                {/* 调整原因 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">调整原因</label>
                  <textarea
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="请填写调整原因..."
                    rows={3}
                  />
                </div>
              </div>

              {/* 底部按钮 */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <button onClick={closeModal} className="admin-btn admin-btn-secondary">
                  取消
                </button>
                <button
                  onClick={handleAdjust}
                  className={`admin-btn ${
                    adjustType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
                >
                  确认调整
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreditManagement;
