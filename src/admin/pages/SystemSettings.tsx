/**
 * 系统设置页面 - 现代化改造版
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  FileText,
  Shield,
  Bell,
  Database,
  Save,
  RefreshCw,
  X,
  Mail,
  Plus,
  Star,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  Building2,
} from 'lucide-react';
import { api, NotificationNode, AdminEmail, EmailTemplate } from '../../api/client';
import { KPICard } from '../../components/admin-ui';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface SystemSettingsProps {
  showToast: (msg: string) => void;
}

interface Settings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  businessEmail: string;
  privacyEmail: string;
  legalEmail: string;
  address: string;
  labInfo: string;
  companyName: string;
  foundedYear: string;
  registeredCapital: string;
  employeeCount: string;
  customerCount: string;
  // 平台对公账户
  platformBankName: string;
  platformBankAccount: string;
  platformBankHolder: string;
  // 功能开关
  enableRegistration: boolean;
  enableEmailVerification: boolean;
  enableSmsVerification: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
  minPasswordLength: number;
  requirePasswordUppercase: boolean;
  requirePasswordNumber: boolean;
  requirePasswordSpecial: boolean;
}

interface Agreement {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const SystemSettings: React.FC<SystemSettingsProps> = ({ showToast }) => {
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('agreements');
  const [settings, setSettings] = useState<Settings>({
    siteName: '芯核交易中心',
    siteDescription: '专业的电子元器件交易平台',
    contactEmail: 'support@coretrading.com',
    contactPhone: '400-888-8888',
    businessEmail: 'business@coretrading.com',
    privacyEmail: 'privacy@coretrading.com',
    legalEmail: 'legal@coretrading.com',
    address: '广东省深圳市龙岗区平湖街道XX物流园3区',
    labInfo: '芯核质检实验室（工号099X）',
    companyName: '深圳芯核科技有限公司',
    foundedYear: '2024',
    registeredCapital: '1000万元',
    employeeCount: '50-100人',
    customerCount: '1000+',
    platformBankName: '招商银行深圳科苑支行',
    platformBankAccount: '7559 8888 6666 888',
    platformBankHolder: '芯核交易平台（深圳）资金暂存专户',
    enableRegistration: true,
    enableEmailVerification: true,
    enableSmsVerification: false,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    minPasswordLength: 8,
    requirePasswordUppercase: true,
    requirePasswordNumber: true,
    requirePasswordSpecial: false,
  });

  // 加载系统配置
  useEffect(() => {
    if (activeTab === 'system' || activeTab === 'security') {
      loadSystemConfig();
    }
  }, [activeTab]);

  const loadSystemConfig = async () => {
    setConfigLoading(true);
    try {
      const config = await api.getSystemConfig();
      setSettings({
        siteName: config.siteName || '芯核交易中心',
        siteDescription: config.siteDescription || '',
        contactEmail: config.contactEmail || '',
        contactPhone: config.contactPhone || '',
        businessEmail: config.businessEmail || '',
        privacyEmail: config.privacyEmail || '',
        legalEmail: config.legalEmail || '',
        address: config.address || '',
        labInfo: config.labInfo || '',
        companyName: config.companyName || '',
        foundedYear: config.foundedYear || '2024',
        registeredCapital: config.registeredCapital || '1000万元',
        employeeCount: config.employeeCount || '50-100人',
        customerCount: config.customerCount || '1000+',
        platformBankName: config.platformBankName || '招商银行深圳科苑支行',
        platformBankAccount: config.platformBankAccount || '7559 8888 6666 888',
        platformBankHolder: config.platformBankHolder || '芯核交易平台（深圳）资金暂存专户',
        enableRegistration: config.enableRegistration ?? true,
        enableEmailVerification: config.enableEmailVerification ?? true,
        enableSmsVerification: config.enableSmsVerification ?? false,
        maxLoginAttempts: config.maxLoginAttempts || 5,
        sessionTimeout: config.sessionTimeout || 30,
        minPasswordLength: config.minPasswordLength || 8,
        requirePasswordUppercase: config.requirePasswordUppercase ?? true,
        requirePasswordNumber: config.requirePasswordNumber ?? true,
        requirePasswordSpecial: config.requirePasswordSpecial ?? false,
      });
    } catch (err) {
      console.error('加载系统配置失败:', err);
    } finally {
      setConfigLoading(false);
    }
  };

  const [agreements, setAgreements] = useState<Agreement[]>([
    { id: 'user-agreement', title: '用户协议', content: '', updatedAt: new Date().toISOString() },
    { id: 'privacy-policy', title: '隐私政策', content: '', updatedAt: new Date().toISOString() },
    { id: 'seller-agreement', title: '供应商协议', content: '', updatedAt: new Date().toISOString() },
  ]);

  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null);

  // 通知配置状态
  const [notificationNodes, setNotificationNodes] = useState<NotificationNode[]>([]);
  const [adminEmails, setAdminEmails] = useState<AdminEmail[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingNode, setEditingNode] = useState<NotificationNode | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    nodes: boolean;
    emails: boolean;
    templates: boolean;
  }>({ nodes: true, emails: true, templates: true });
  const [newEmail, setNewEmail] = useState({ email: '', name: '' });

  // 加载通知配置数据
  useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotificationConfig();
    }
  }, [activeTab]);

  const loadNotificationConfig = async () => {
    setLoading(true);
    try {
      const [nodes, emails, templates] = await Promise.all([
        api.getNotificationNodes().catch(() => []),
        api.getAdminEmails().catch(() => []),
        api.getEmailTemplates().catch(() => []),
      ]);
      setNotificationNodes(nodes);
      setAdminEmails(emails);
      setEmailTemplates(templates);
    } catch (err) {
      console.error('加载通知配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 更新通知节点
  const handleUpdateNode = async (
    code: string,
    field: 'adminMessageEnabled' | 'adminEmailEnabled' | 'userNotificationEnabled',
    value: boolean
  ) => {
    try {
      await api.updateNotificationNode(code, { [field]: value });
      setNotificationNodes((prev) =>
        prev.map((node) => (node.code === code ? { ...node, [field]: value } : node))
      );
      showToast('配置已更新');
    } catch (err) {
      showToast('更新失败');
    }
  };

  // 添加管理员邮箱
  const handleAddAdminEmail = async () => {
    if (!newEmail.email) {
      showToast('请输入邮箱地址');
      return;
    }
    try {
      const email = await api.addAdminEmail(newEmail.email, newEmail.name);
      setAdminEmails((prev) => [...prev, email]);
      setNewEmail({ email: '', name: '' });
      showToast('邮箱已添加');
    } catch (err: any) {
      showToast(err.message || '添加失败');
    }
  };

  // 设为主邮箱
  const handleSetPrimary = async (id: string) => {
    try {
      await api.setPrimaryEmail(id);
      setAdminEmails((prev) =>
        prev.map((email) => ({ ...email, isPrimary: email.id === id }))
      );
      showToast('已设为主邮箱');
    } catch (err) {
      showToast('操作失败');
    }
  };

  // 删除管理员邮箱
  const handleDeleteEmail = async (id: string) => {
    try {
      await api.deleteAdminEmail(id);
      setAdminEmails((prev) => prev.filter((email) => email.id !== id));
      showToast('邮箱已删除');
    } catch (err) {
      showToast('删除失败');
    }
  };

  // 更新邮件模版
  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    try {
      const updated = await api.updateEmailTemplate(editingTemplate.code, {
        subject: editingTemplate.subject,
        body: editingTemplate.body,
        adminSubject: editingTemplate.adminSubject,
        adminBody: editingTemplate.adminBody,
      });
      setEmailTemplates((prev) =>
        prev.map((t) => (t.code === editingTemplate.code ? updated : t))
      );
      setEditingTemplate(null);
      showToast('模版已保存');
    } catch (err) {
      showToast('保存失败');
    }
  };

  // 保存设置
  const handleSaveSettings = useCallback(async () => {
    setLoading(true);
    try {
      await api.updateSystemConfig(settings);
      showToast('设置已保存');
    } catch (err: any) {
      showToast(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  }, [settings, showToast]);

  // 保存协议
  const handleSaveAgreement = useCallback(async () => {
    if (!editingAgreement) return;
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setAgreements((prev) =>
        prev.map((a) =>
          a.id === editingAgreement.id ? { ...editingAgreement, updatedAt: new Date().toISOString() } : a
        )
      );
      showToast('协议已保存');
      setEditingAgreement(null);
    } catch (err) {
      showToast('保存失败');
    } finally {
      setLoading(false);
    }
  }, [editingAgreement, showToast]);

  const tabs = [
    { id: 'agreements', label: '协议管理', icon: FileText },
    { id: 'security', label: '安全设置', icon: Shield },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'system', label: '系统配置', icon: Database },
  ];

  // 按分类分组通知节点
  const nodesByCategory = notificationNodes.reduce(
    (acc, node) => {
      if (!acc[node.category]) acc[node.category] = [];
      acc[node.category].push(node);
      return acc;
    },
    {} as Record<string, NotificationNode[]>
  );

  const categoryLabels: Record<string, string> = {
    order: '订单通知',
    negotiation: '议价通知',
    system: '系统通知',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-500 mt-1 text-sm">平台系统配置</p>
        </div>
      </div>

      {/* KPI 概览 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="协议数量"
          value={agreements.length.toString()}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="登录限制"
          value={`${settings.maxLoginAttempts} 次`}
          icon={<Shield className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          title="管理员邮箱"
          value={adminEmails.length.toString()}
          icon={<Mail className="w-5 h-5" />}
          color="purple"
        />
        <KPICard
          title="通知节点"
          value={notificationNodes.length.toString()}
          icon={<Bell className="w-5 h-5" />}
          color="orange"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 左侧标签页 */}
        <div className="lg:w-48 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
          >
            {/* 协议管理 */}
            {activeTab === 'agreements' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">协议管理</h3>
                <div className="space-y-3">
                  {agreements.map((agreement) => (
                    <div
                      key={agreement.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{agreement.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          最后更新: {new Date(agreement.updatedAt).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingAgreement({ ...agreement })}
                        className="admin-btn admin-btn-primary text-sm py-1.5"
                      >
                        编辑
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 安全设置 */}
            {activeTab === 'security' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">安全设置</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">密码策略</label>
                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">最小密码长度</span>
                        <input
                          type="number"
                          value={settings.minPasswordLength}
                          onChange={(e) =>
                            setSettings({ ...settings, minPasswordLength: parseInt(e.target.value) || 8 })
                          }
                          className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">要求大写字母</span>
                        <input
                          type="checkbox"
                          checked={settings.requirePasswordUppercase}
                          onChange={(e) => setSettings({ ...settings, requirePasswordUppercase: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">要求数字</span>
                        <input
                          type="checkbox"
                          checked={settings.requirePasswordNumber}
                          onChange={(e) => setSettings({ ...settings, requirePasswordNumber: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">登录安全</label>
                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">最大登录尝试次数</span>
                        <input
                          type="number"
                          value={settings.maxLoginAttempts}
                          onChange={(e) =>
                            setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 5 })
                          }
                          className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">会话超时时间 (分钟)</span>
                        <input
                          type="number"
                          value={settings.sessionTimeout}
                          onChange={(e) =>
                            setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 30 })
                          }
                          className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveSettings}
                      disabled={loading}
                      className="admin-btn admin-btn-primary"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      保存设置
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* 通知设置 */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">通知配置</h3>

                {loading ? (
                  <div className="flex items-center justify-center py-12 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    加载中...
                  </div>
                ) : (
                  <>
                    {/* 1. 通知节点配置 */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSections((s) => ({ ...s, nodes: !s.nodes }))}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Bell className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">通知节点配置</span>
                          <span className="text-xs text-gray-500">({notificationNodes.length})</span>
                        </div>
                        {expandedSections.nodes ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {expandedSections.nodes && (
                        <div className="p-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-2 px-3 font-medium text-gray-700">节点名称</th>
                                  <th className="text-center py-2 px-3 font-medium text-gray-700">站内通知管理员</th>
                                  <th className="text-center py-2 px-3 font-medium text-gray-700">邮件通知管理员</th>
                                  <th className="text-center py-2 px-3 font-medium text-gray-700">通知用户</th>
                                  <th className="text-center py-2 px-3 font-medium text-gray-700">操作</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(nodesByCategory).map(([category, nodes]) => (
                                  <React.Fragment key={category}>
                                    <tr className="bg-gray-50">
                                      <td colSpan={5} className="py-2 px-3 font-medium text-gray-600">
                                        {categoryLabels[category] || category}
                                      </td>
                                    </tr>
                                    {(nodes as NotificationNode[]).map((node) => (
                                      <tr key={node.code} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-2 px-3">
                                          <div className="font-medium text-gray-900">{node.name}</div>
                                          <div className="text-xs text-gray-500">{node.description}</div>
                                        </td>
                                        <td className="text-center py-2 px-3">
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                            node.adminMessageEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                          }`}>
                                            {node.adminMessageEnabled ? '✓ 启用' : '✗ 关闭'}
                                          </span>
                                        </td>
                                        <td className="text-center py-2 px-3">
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                            node.adminEmailEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                          }`}>
                                            {node.adminEmailEnabled ? '✓ 启用' : '✗ 关闭'}
                                          </span>
                                        </td>
                                        <td className="text-center py-2 px-3">
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                            node.userNotificationEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                          }`}>
                                            {node.userNotificationEnabled ? '✓ 启用' : '✗ 关闭'}
                                          </span>
                                        </td>
                                        <td className="text-center py-2 px-3">
                                          <button
                                            onClick={() => setEditingNode(node)}
                                            className="admin-btn admin-btn-secondary text-xs py-1 px-2"
                                          >
                                            <Settings className="w-3 h-3" />
                                            配置
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. 管理员邮箱配置 */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSections((s) => ({ ...s, emails: !s.emails }))}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Mail className="w-5 h-5 text-purple-600" />
                          <span className="font-medium">管理员邮箱</span>
                          <span className="text-xs text-gray-500">({adminEmails.length})</span>
                        </div>
                        {expandedSections.emails ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {expandedSections.emails && (
                        <div className="p-4 space-y-4">
                          {/* 邮箱列表 */}
                          {adminEmails.length > 0 ? (
                            <div className="space-y-2">
                              {adminEmails.map((email) => (
                                <div
                                  key={email.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    {email.isPrimary && (
                                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    )}
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {email.email}
                                        {email.isPrimary && (
                                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                            主邮箱
                                          </span>
                                        )}
                                      </div>
                                      {email.name && (
                                        <div className="text-xs text-gray-500">{email.name}</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {!email.isPrimary && (
                                      <button
                                        onClick={() => handleSetPrimary(email.id)}
                                        className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                                        title="设为主邮箱"
                                      >
                                        <Star className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteEmail(email.id)}
                                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      title="删除"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-400 text-sm">暂无管理员邮箱</div>
                          )}

                          {/* 添加新邮箱 */}
                          <div className="flex gap-2 pt-2 border-t border-gray-200">
                            <input
                              type="email"
                              placeholder="邮箱地址"
                              value={newEmail.email}
                              onChange={(e) => setNewEmail({ ...newEmail, email: e.target.value })}
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="联系人（可选）"
                              value={newEmail.name}
                              onChange={(e) => setNewEmail({ ...newEmail, name: e.target.value })}
                              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={handleAddAdminEmail}
                              className="admin-btn admin-btn-primary text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              添加
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. 邮件模版管理 */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSections((s) => ({ ...s, templates: !s.templates }))}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-5 h-5 text-green-600" />
                          <span className="font-medium">邮件模版</span>
                          <span className="text-xs text-gray-500">({emailTemplates.length})</span>
                        </div>
                        {expandedSections.templates ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {expandedSections.templates && (
                        <div className="p-4">
                          <div className="space-y-2">
                            {emailTemplates.map((template) => (
                              <div
                                key={template.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div>
                                  <div className="font-medium text-gray-900">{template.name}</div>
                                  <div className="text-xs text-gray-500">{template.subject}</div>
                                </div>
                                <button
                                  onClick={() => setEditingTemplate(template)}
                                  className="admin-btn admin-btn-secondary text-sm py-1.5"
                                >
                                  编辑
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 系统配置 */}
            {activeTab === 'system' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">系统配置</h3>
                {configLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    加载中...
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* 基本信息 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        基本信息
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">网站名称</label>
                          <input
                            type="text"
                            value={settings.siteName}
                            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                            className="admin-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">运营公司</label>
                          <input
                            type="text"
                            value={settings.companyName}
                            onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                            className="admin-input"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm text-gray-600 mb-1">网站描述</label>
                          <textarea
                            value={settings.siteDescription}
                            onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 联系方式 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        联系方式
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">客服热线</label>
                          <input
                            type="text"
                            value={settings.contactPhone}
                            onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                            className="admin-input"
                            placeholder="400-888-8888"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">客服邮箱</label>
                          <input
                            type="email"
                            value={settings.contactEmail}
                            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                            className="admin-input"
                            placeholder="support@coretrading.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">商务合作邮箱</label>
                          <input
                            type="email"
                            value={settings.businessEmail}
                            onChange={(e) => setSettings({ ...settings, businessEmail: e.target.value })}
                            className="admin-input"
                            placeholder="business@coretrading.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">隐私政策邮箱</label>
                          <input
                            type="email"
                            value={settings.privacyEmail}
                            onChange={(e) => setSettings({ ...settings, privacyEmail: e.target.value })}
                            className="admin-input"
                            placeholder="privacy@coretrading.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">法务邮箱</label>
                          <input
                            type="email"
                            value={settings.legalEmail}
                            onChange={(e) => setSettings({ ...settings, legalEmail: e.target.value })}
                            className="admin-input"
                            placeholder="legal@coretrading.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 公司地址 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        公司地址
                      </h4>
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">公司地址</label>
                          <input
                            type="text"
                            value={settings.address}
                            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                            className="admin-input"
                            placeholder="广东省深圳市龙岗区平湖街道XX物流园3区"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">质检实验室信息</label>
                          <input
                            type="text"
                            value={settings.labInfo}
                            onChange={(e) => setSettings({ ...settings, labInfo: e.target.value })}
                            className="admin-input"
                            placeholder="芯核质检实验室（工号099X）"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 公司信息（用于"关于我们"页面） */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        公司信息
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">成立年份</label>
                          <input
                            type="text"
                            value={settings.foundedYear}
                            onChange={(e) => setSettings({ ...settings, foundedYear: e.target.value })}
                            className="admin-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">注册资本</label>
                          <input
                            type="text"
                            value={settings.registeredCapital}
                            onChange={(e) => setSettings({ ...settings, registeredCapital: e.target.value })}
                            className="admin-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">员工规模</label>
                          <input
                            type="text"
                            value={settings.employeeCount}
                            onChange={(e) => setSettings({ ...settings, employeeCount: e.target.value })}
                            className="admin-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">服务客户</label>
                          <input
                            type="text"
                            value={settings.customerCount}
                            onChange={(e) => setSettings({ ...settings, customerCount: e.target.value })}
                            className="admin-input"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 平台对公账户 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        平台对公账户
                      </h4>
                      <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">开户名</label>
                          <input
                            type="text"
                            value={settings.platformBankHolder}
                            onChange={(e) => setSettings({ ...settings, platformBankHolder: e.target.value })}
                            className="admin-input"
                            placeholder="芯核交易平台（深圳）资金暂存专户"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">开户行</label>
                            <input
                              type="text"
                              value={settings.platformBankName}
                              onChange={(e) => setSettings({ ...settings, platformBankName: e.target.value })}
                              className="admin-input"
                              placeholder="招商银行深圳科苑支行"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">银行账号</label>
                            <input
                              type="text"
                              value={settings.platformBankAccount}
                              onChange={(e) => setSettings({ ...settings, platformBankAccount: e.target.value })}
                              className="admin-input font-mono"
                              placeholder="7559 8888 6666 888"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          此账户信息将显示在买家对公转账支付页面，请确保信息准确无误。
                        </p>
                      </div>
                    </div>

                    {/* 功能开关 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        功能开关
                      </h4>
                      <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">开放用户注册</span>
                          <input
                            type="checkbox"
                            checked={settings.enableRegistration}
                            onChange={(e) => setSettings({ ...settings, enableRegistration: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">邮箱验证</span>
                          <input
                            type="checkbox"
                            checked={settings.enableEmailVerification}
                            onChange={(e) => setSettings({ ...settings, enableEmailVerification: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">短信验证</span>
                          <input
                            type="checkbox"
                            checked={settings.enableSmsVerification}
                            onChange={(e) => setSettings({ ...settings, enableSmsVerification: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveSettings}
                        disabled={loading}
                        className="admin-btn admin-btn-primary"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        保存设置
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* 协议编辑弹窗 */}
      <AnimatePresence>
        {editingAgreement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingAgreement(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
                <h3 className="text-lg font-semibold text-gray-900">编辑{editingAgreement.title}</h3>
                <button
                  onClick={() => setEditingAgreement(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <textarea
                  value={editingAgreement.content}
                  onChange={(e) => setEditingAgreement({ ...editingAgreement, content: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={20}
                  placeholder="请输入协议内容..."
                />
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <button onClick={() => setEditingAgreement(null)} className="admin-btn admin-btn-secondary">
                  取消
                </button>
                <button onClick={handleSaveAgreement} disabled={loading} className="admin-btn admin-btn-primary">
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 邮件模版编辑弹窗 */}
      <AnimatePresence>
        {editingTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingTemplate(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
                <h3 className="text-lg font-semibold text-gray-900">编辑邮件模版 - {editingTemplate.name}</h3>
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* 可用变量提示 */}
                {editingTemplate.variables && editingTemplate.variables.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-700 mb-2">可用变量：</div>
                    <div className="flex flex-wrap gap-2">
                      {editingTemplate.variables.map((v) => (
                        <code key={v} className="px-2 py-1 bg-white rounded text-xs text-blue-600">
                          {`{${v}}`}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {/* 发送给用户的邮件 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">发送给用户的邮件</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">邮件标题</label>
                      <input
                        type="text"
                        value={editingTemplate.subject}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">邮件正文</label>
                      <textarea
                        value={editingTemplate.body}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                        rows={6}
                      />
                    </div>
                  </div>
                </div>

                {/* 发送给管理员的邮件 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">发送给管理员的邮件</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">邮件标题</label>
                      <input
                        type="text"
                        value={editingTemplate.adminSubject || ''}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, adminSubject: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">邮件正文</label>
                      <textarea
                        value={editingTemplate.adminBody || ''}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, adminBody: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                        rows={6}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <button onClick={() => setEditingTemplate(null)} className="admin-btn admin-btn-secondary">
                  取消
                </button>
                <button onClick={handleSaveTemplate} disabled={loading} className="admin-btn admin-btn-primary">
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 通知节点配置弹窗 */}
      <AnimatePresence>
        {editingNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingNode(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">配置通知节点</h3>
                <button
                  onClick={() => setEditingNode(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="font-medium text-gray-900">{editingNode.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{editingNode.description}</div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-700">站内消息通知管理员</div>
                      <div className="text-xs text-gray-500">管理员将收到站内消息</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editingNode.adminMessageEnabled}
                      onChange={(e) => setEditingNode({ ...editingNode, adminMessageEnabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-700">邮件通知管理员</div>
                      <div className="text-xs text-gray-500">管理员将收到邮件通知</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editingNode.adminEmailEnabled}
                      onChange={(e) => setEditingNode({ ...editingNode, adminEmailEnabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-700">通知用户</div>
                      <div className="text-xs text-gray-500">买家或卖家将收到通知</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editingNode.userNotificationEnabled}
                      onChange={(e) => setEditingNode({ ...editingNode, userNotificationEnabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <button onClick={() => setEditingNode(null)} className="admin-btn admin-btn-secondary">
                  取消
                </button>
                <button
                  onClick={async () => {
                    if (!editingNode) return;
                    setLoading(true);
                    try {
                      await api.updateNotificationNode(editingNode.code, {
                        adminMessageEnabled: editingNode.adminMessageEnabled,
                        adminEmailEnabled: editingNode.adminEmailEnabled,
                        userNotificationEnabled: editingNode.userNotificationEnabled,
                      });
                      setNotificationNodes((prev) =>
                        prev.map((n) => (n.code === editingNode.code ? editingNode : n))
                      );
                      setEditingNode(null);
                      showToast('配置已保存');
                    } catch (err) {
                      showToast('保存失败');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="admin-btn admin-btn-primary"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SystemSettings;
