/**
 * 认证审核页面 - 现代化改造版
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
  Building2,
  Eye,
  Mail,
  Phone,
  FileText,
  Calendar,
  X,
  User,
  MapPin,
  Clock,
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
  phone?: string;
  address?: string;
  businessLicense?: string;
  businessLicenseImage?: string;
  idCardImage?: string;
  legalPerson?: string;
  registeredCapital?: string;
  createdAt: string;
}

interface CertificationReviewProps {
  showToast: (msg: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const CertificationReview: React.FC<CertificationReviewProps> = ({ showToast }) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalType, setModalType] = useState<'detail' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [stats, setStats] = useState({ pending: 0, approvedToday: 0, rejectedToday: 0 });

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersResult, statsResult] = await Promise.all([
        api.getAdminUsers({ verificationStatus: 'pending', page: 1, pageSize: 50 }),
        api.getCertificationStats(),
      ]);
      setUsers(usersResult.items);
      setTotal(usersResult.total);
      setStats(statsResult);
    } catch (err) {
      console.error('加载待审核用户失败:', err);
      showToast('加载待审核用户失败');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 通过认证
  const handleApprove = async (userId: string) => {
    try {
      await api.updateUserStatus(userId, { verificationStatus: 'verified' });
      showToast('认证已通过');
      loadData();
    } catch (err) {
      showToast('操作失败');
    }
  };

  // 拒绝认证
  const handleReject = async () => {
    if (!selectedUser || !rejectReason.trim()) {
      showToast('请填写拒绝原因');
      return;
    }
    try {
      await api.updateUserStatus(selectedUser.id, { verificationStatus: 'rejected' });
      showToast('认证已拒绝');
      closeModal();
      loadData();
    } catch (err) {
      showToast('操作失败');
    }
  };

  // 打开弹窗
  const openModal = (type: 'detail' | 'reject', user: User) => {
    setSelectedUser(user);
    setModalType(type);
    if (type === 'reject') setRejectReason('');
  };

  // 关闭弹窗
  const closeModal = () => {
    setSelectedUser(null);
    setModalType(null);
    setRejectReason('');
  };

  // 表格列定义
  const columns: Column<User>[] = [
    {
      key: 'company',
      title: '企业信息',
      render: (_, user) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
              user.role === 'buyer' ? 'bg-blue-500' : 'bg-purple-500'
            }`}
          >
            <Building2 className="w-5 h-5" />
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
      key: 'createdAt',
      title: '申请时间',
      width: 140,
      hideOnMobile: true,
      render: (_, user) => (
        <span className="text-sm text-gray-500">
          {new Date(user.createdAt).toLocaleDateString('zh-CN')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 200,
      align: 'right',
      render: (_, user) => (
        <div className="flex items-center justify-end gap-2">
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
              handleApprove(user.id);
            }}
            className="admin-btn admin-btn-primary text-sm py-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            通过
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal('reject', user);
            }}
            className="admin-btn bg-red-500 hover:bg-red-600 text-white text-sm py-1.5"
          >
            <XCircle className="w-4 h-4" />
            拒绝
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
          <h1 className="text-2xl font-bold text-gray-900">认证审核</h1>
          <p className="text-gray-500 mt-1 text-sm">审核企业认证申请，共 {total} 条待处理</p>
        </div>
        <button onClick={loadData} disabled={loading} className="admin-btn admin-btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* KPI 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="待审核"
          value={stats.pending.toLocaleString()}
          icon={<ShieldCheck className="w-5 h-5" />}
          color="orange"
        />
        <KPICard
          title="今日通过"
          value={stats.approvedToday.toLocaleString()}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          title="今日拒绝"
          value={stats.rejectedToday.toLocaleString()}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* 数据表格 */}
      <DataTable
        data={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyText="暂无待审核的认证申请"
      />

      {/* 弹窗 */}
      <AnimatePresence>
        {modalType && selectedUser && (
          <CertificationModal
            type={modalType}
            user={selectedUser}
            rejectReason={rejectReason}
            setRejectReason={setRejectReason}
            onClose={closeModal}
            onApprove={() => {
              closeModal();
              handleApprove(selectedUser.id);
            }}
            onReject={handleReject}
            onOpenReject={() => {
              closeModal();
              setTimeout(() => openModal('reject', selectedUser), 100);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 认证详情弹窗
// ═══════════════════════════════════════════════════════════════

interface CertificationModalProps {
  type: 'detail' | 'reject';
  user: User;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onOpenReject: () => void;
}

const CertificationModal: React.FC<CertificationModalProps> = ({
  type,
  user,
  rejectReason,
  setRejectReason,
  onClose,
  onApprove,
  onReject,
  onOpenReject,
}) => (
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
      className={`bg-white rounded-xl shadow-xl w-full ${
        type === 'detail' ? 'max-w-2xl max-h-[90vh] overflow-y-auto' : 'max-w-md'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl">
        <h3 className="text-lg font-semibold text-gray-900">
          {type === 'detail' ? '认证资料详情' : '拒绝认证申请'}
        </h3>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 内容 */}
      <div className="p-6">
        {type === 'detail' ? (
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                  user.role === 'buyer' ? 'bg-blue-500' : 'bg-purple-500'
                }`}
              >
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{user.companyName}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`admin-badge ${
                      user.role === 'buyer' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}
                  >
                    {user.role === 'buyer' ? '采购商' : '供应商'}
                  </span>
                  <span className="text-sm text-gray-500">等待审核</span>
                </div>
              </div>
            </div>

            {/* 企业信息 */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                企业信息
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">企业名称</div>
                  <div className="font-medium">{user.companyName}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">统一社会信用代码</div>
                  <div className="font-mono text-sm">{user.businessLicense || '未提供'}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">法人代表</div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4 text-gray-400" />
                    {user.legalPerson || '未提供'}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">注册资本</div>
                  <div>{user.registeredCapital || '未提供'}</div>
                </div>
              </div>
            </div>

            {/* 联系信息 */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                联系信息
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">联系邮箱</div>
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {user.email}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">联系电话</div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {user.phone || '未提供'}
                  </div>
                </div>
                {user.address && (
                  <div className="p-4 bg-gray-50 rounded-xl col-span-2">
                    <div className="text-xs text-gray-500 mb-1">企业地址</div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {user.address}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 证照信息 */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                证照信息
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-2">营业执照</div>
                  {user.businessLicenseImage ? (
                    <img
                      src={user.businessLicenseImage}
                      alt="营业执照"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
                      暂无图片
                    </div>
                  )}
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-2">法人身份证</div>
                  {user.idCardImage ? (
                    <img
                      src={user.idCardImage}
                      alt="法人身份证"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
                      暂无图片
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 申请时间 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">申请时间</div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                {new Date(user.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              企业: <span className="font-medium">{user.companyName}</span>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">拒绝原因</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入拒绝原因..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
              />
            </div>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <button onClick={onClose} className="admin-btn admin-btn-secondary">
          {type === 'detail' ? '关闭' : '取消'}
        </button>
        {type === 'detail' && (
          <>
            <button onClick={onApprove} className="admin-btn admin-btn-primary">
              <CheckCircle className="w-4 h-4" />
              通过认证
            </button>
            <button onClick={onOpenReject} className="admin-btn bg-red-500 hover:bg-red-600 text-white">
              <XCircle className="w-4 h-4" />
              拒绝认证
            </button>
          </>
        )}
        {type === 'reject' && (
          <button onClick={onReject} className="admin-btn bg-red-500 hover:bg-red-600 text-white">
            确认拒绝
          </button>
        )}
      </div>
    </motion.div>
  </motion.div>
);

export default CertificationReview;
