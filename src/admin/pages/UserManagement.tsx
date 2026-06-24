/**
 * 用户管理页面 - 现代化改造版
 *
 * 改造要点：
 * - 使用 DataTable 组件
 * - 添加 KPI 统计卡片
 * - 响应式设计
 * - 动画效果
 * - 统一样式规范
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Eye,
  Edit,
  Trash2,
  Star,
  Shield,
  X,
  UserCheck,
  UserX,
  Building2,
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
  role: 'buyer' | 'seller';
  creditScore: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  phone?: string;
  address?: string;
  createdAt: string;
}

interface UserManagementProps {
  showToast: (msg: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const UserManagement: React.FC<UserManagementProps> = ({ showToast }) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<{ role?: string; verificationStatus?: string }>({});
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalType, setModalType] = useState<'detail' | 'edit' | 'delete' | null>(null);
  const [editForm, setEditForm] = useState({ creditScore: 60 });

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getAdminUsers({
        ...filter,
        page: 1,
        pageSize: 50,
      });
      setUsers(result.items);
      setTotal(result.total);
    } catch (err) {
      console.error('加载用户失败:', err);
      showToast('加载用户失败');
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 更新用户状态
  const handleUpdateStatus = async (
    userId: string,
    data: { verificationStatus?: 'pending' | 'verified' | 'rejected'; creditScore?: number }
  ) => {
    try {
      await api.updateUserStatus(userId, data);
      showToast('更新成功');
      loadData();
    } catch (err) {
      showToast('更新失败');
    }
  };

  // 编辑保存
  const handleEdit = async () => {
    if (!selectedUser) return;
    await handleUpdateStatus(selectedUser.id, { creditScore: editForm.creditScore });
    closeModal();
  };

  // 删除用户
  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      const result = await api.deleteAdminUser(selectedUser.id);
      showToast(result.softDelete ? '用户已禁用（存在关联数据）' : '用户已删除');
      closeModal();
      loadData();
    } catch (err) {
      showToast('删除失败');
    }
  };

  // 打开弹窗
  const openModal = (type: 'detail' | 'edit' | 'delete', user: User) => {
    setSelectedUser(user);
    setModalType(type);
    if (type === 'edit') {
      setEditForm({ creditScore: user.creditScore });
    }
  };

  // 关闭弹窗
  const closeModal = () => {
    setSelectedUser(null);
    setModalType(null);
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
    total: users.length,
    buyers: users.filter((u) => u.role === 'buyer').length,
    sellers: users.filter((u) => u.role === 'seller').length,
    pending: users.filter((u) => u.verificationStatus === 'pending').length,
    verified: users.filter((u) => u.verificationStatus === 'verified').length,
    rejected: users.filter((u) => u.verificationStatus === 'rejected').length,
  };

  // 表格列定义
  const columns: Column<User>[] = [
    {
      key: 'user',
      title: '用户',
      render: (_, user) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
              user.role === 'buyer' ? 'bg-blue-500' : 'bg-purple-500'
            }`}
          >
            {user.companyName?.charAt(0) || '?'}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">{user.companyName}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
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
            user.role === 'buyer' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
          }`}
        >
          {user.role === 'buyer' ? '采购商' : '供应商'}
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
        <div className="flex items-center justify-center gap-1">
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
      key: 'verificationStatus',
      title: '状态',
      width: 100,
      render: (_, user) => {
        const statusMap = {
          pending: { text: '待审核', className: 'admin-badge-warning' },
          verified: { text: '已认证', className: 'admin-badge-success' },
          rejected: { text: '已拒绝', className: 'admin-badge-error' },
        };
        const status = statusMap[user.verificationStatus];
        return <span className={`admin-badge ${status.className}`}>{status.text}</span>;
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      align: 'right',
      render: (_, user) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('detail', user);
            }}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('edit', user);
            }}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </button>
          {user.verificationStatus === 'pending' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(user.id, { verificationStatus: 'verified' });
                }}
                className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                title="通过认证"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateStatus(user.id, { verificationStatus: 'rejected' });
                }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="拒绝认证"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {user.verificationStatus === 'rejected' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(user.id, { verificationStatus: 'verified' });
              }}
              className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
              title="恢复认证"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('delete', user);
            }}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="删除用户"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-500 mt-1 text-sm">管理平台所有用户，共 {total} 位</p>
        </div>
        <button onClick={loadData} disabled={loading} className="admin-btn admin-btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* KPI 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="总用户"
          value={stats.total.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="采购商"
          value={stats.buyers.toLocaleString()}
          icon={<UserCheck className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          title="供应商"
          value={stats.sellers.toLocaleString()}
          icon={<Building2 className="w-5 h-5" />}
          color="purple"
        />
        <KPICard
          title="待审核"
          value={stats.pending.toLocaleString()}
          icon={<Shield className="w-5 h-5" />}
          color="orange"
          subtitle={`已认证: ${stats.verified} | 已拒绝: ${stats.rejected}`}
        />
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="搜索用户邮箱或企业名称..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 角色筛选 */}
          <select
            value={filter.role || ''}
            onChange={(e) => setFilter({ ...filter, role: e.target.value || undefined })}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[120px]"
          >
            <option value="">全部角色</option>
            <option value="buyer">采购商</option>
            <option value="seller">供应商</option>
          </select>

          {/* 认证状态筛选 */}
          <select
            value={filter.verificationStatus || ''}
            onChange={(e) => setFilter({ ...filter, verificationStatus: e.target.value || undefined })}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[120px]"
          >
            <option value="">全部状态</option>
            <option value="pending">待审核</option>
            <option value="verified">已认证</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
      </div>

      {/* 数据表格 */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyText="暂无用户数据"
        pagination={{
          current: 1,
          pageSize: 50,
          total: filteredUsers.length,
        }}
      />

      {/* 弹窗 */}
      <AnimatePresence>
        {modalType && selectedUser && (
          <Modal
            type={modalType}
            user={selectedUser}
            editForm={editForm}
            setEditForm={setEditForm}
            onClose={closeModal}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 弹窗组件
// ═══════════════════════════════════════════════════════════════

interface ModalProps {
  type: 'detail' | 'edit' | 'delete';
  user: User;
  editForm: { creditScore: number };
  setEditForm: React.Dispatch<React.SetStateAction<{ creditScore: number }>>;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const Modal: React.FC<ModalProps> = ({
  type,
  user,
  editForm,
  setEditForm,
  onClose,
  onEdit,
  onDelete,
}) => {
  const statusMap = {
    pending: { text: '待审核', icon: Shield, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    verified: { text: '已认证', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    rejected: { text: '已拒绝', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  };
  const status = statusMap[user.verificationStatus];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {type === 'detail' && '用户详情'}
            {type === 'edit' && '编辑用户'}
            {type === 'delete' && '确认删除'}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {type === 'detail' && (
            <div className="space-y-4">
              {/* 用户头像和基本信息 */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                    user.role === 'buyer' ? 'bg-blue-500' : 'bg-purple-500'
                  }`}
                >
                  {user.companyName?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-bold text-gray-900 truncate">{user.companyName}</div>
                  <div className="text-sm text-gray-500 truncate">{user.email}</div>
                </div>
              </div>

              {/* 详细信息网格 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-2">角色</div>
                  <span
                    className={`admin-badge ${
                      user.role === 'buyer' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}
                  >
                    {user.role === 'buyer' ? '采购商' : '供应商'}
                  </span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-2">信用分</div>
                  <div className="flex items-center gap-2">
                    <Star
                      className={`w-5 h-5 ${
                        user.creditScore >= 80
                          ? 'text-green-500'
                          : user.creditScore >= 60
                          ? 'text-yellow-500'
                          : 'text-red-500'
                      }`}
                    />
                    <span className="font-mono font-bold text-xl">{user.creditScore}</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-2">认证状态</div>
                  <div className={`flex items-center gap-2 ${status.color}`}>
                    <StatusIcon className="w-5 h-5" />
                    <span className="font-medium">{status.text}</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-2">注册时间</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>

              {/* 联系信息 */}
              {user.phone && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-2">联系电话</div>
                  <div className="font-medium text-gray-900">{user.phone}</div>
                </div>
              )}

              {user.address && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-2">地址</div>
                  <div className="font-medium text-gray-900">{user.address}</div>
                </div>
              )}
            </div>
          )}

          {type === 'edit' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                    user.role === 'buyer' ? 'bg-blue-500' : 'bg-purple-500'
                  }`}
                >
                  {user.companyName?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{user.companyName}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">信用分</label>
                <input
                  type="range"
                  value={editForm.creditScore}
                  onChange={(e) => setEditForm({ creditScore: parseInt(e.target.value) })}
                  min={0}
                  max={100}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span className="font-mono font-bold text-lg text-gray-900">{editForm.creditScore}</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          )}

          {type === 'delete' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                      user.role === 'buyer' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}
                  >
                    {user.companyName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.companyName}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                删除后用户数据将无法恢复，确定要删除此用户吗？
              </p>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="admin-btn admin-btn-secondary">
            {type === 'detail' ? '关闭' : '取消'}
          </button>
          {type === 'edit' && (
            <button onClick={onEdit} className="admin-btn admin-btn-primary">
              保存修改
            </button>
          )}
          {type === 'delete' && (
            <button onClick={onDelete} className="admin-btn bg-red-600 hover:bg-red-700 text-white">
              确认删除
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserManagement;
