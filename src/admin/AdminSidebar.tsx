/**
 * 管理后台 - 侧边栏导航
 *
 * 改造要点：
 * - 更明显的激活状态
 * - 分组导航
 * - 响应式设计（移动端 Drawer）
 * - 支持徽章提示
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Star,
  Package,
  Warehouse,
  Wallet,
  Building2,
  CreditCard,
  Newspaper,
  ClipboardCheck,
  FileCheck,
  Key,
  Webhook,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  group: 'core' | 'finance' | 'system';
  badge?: number | string;
}

interface NavGroup {
  label: string;
  order: number;
}

// ═══════════════════════════════════════════════════════════════
// 导航配置
// ═══════════════════════════════════════════════════════════════

const navItems: NavItem[] = [
  { id: 'dashboard', label: '数据概览', icon: <LayoutDashboard className="w-5 h-5" />, group: 'core' },
  { id: 'users', label: '用户管理', icon: <Users className="w-5 h-5" />, group: 'core' },
  { id: 'certification', label: '认证审核', icon: <ShieldCheck className="w-5 h-5" />, group: 'core' },
  { id: 'credit', label: '信用分管理', icon: <Star className="w-5 h-5" />, group: 'core' },
  { id: 'orders', label: '订单管理', icon: <Package className="w-5 h-5" />, group: 'core' },
  { id: 'inventory', label: '库存管理', icon: <Warehouse className="w-5 h-5" />, group: 'core' },
  { id: 'settlement', label: '结算审核', icon: <Wallet className="w-5 h-5" />, group: 'finance' },
  { id: 'corporate-payment', label: '对公支付', icon: <Building2 className="w-5 h-5" />, group: 'finance' },
  { id: 'payment-config', label: '支付配置', icon: <CreditCard className="w-5 h-5" />, group: 'finance' },
  { id: 'news', label: '新闻公告', icon: <Newspaper className="w-5 h-5" />, group: 'system' },
  { id: 'qa', label: 'QA质检', icon: <ClipboardCheck className="w-5 h-5" />, group: 'system' },
  { id: 'quality-reports', label: '质检报告', icon: <FileCheck className="w-5 h-5" />, group: 'system' },
  { id: 'api', label: 'API管理', icon: <Key className="w-5 h-5" />, group: 'system' },
  { id: 'webhook', label: 'Webhook', icon: <Webhook className="w-5 h-5" />, group: 'system' },
  { id: 'settings', label: '系统设置', icon: <Settings className="w-5 h-5" />, group: 'system' },
];

const groups: Record<string, NavGroup> = {
  core: { label: '核心管理', order: 1 },
  finance: { label: '财务管理', order: 2 },
  system: { label: '系统管理', order: 3 },
};

// ═══════════════════════════════════════════════════════════════
// 导航项组件
// ═══════════════════════════════════════════════════════════════

interface NavItemButtonProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

const NavItemButton: React.FC<NavItemButtonProps> = ({
  item,
  active,
  collapsed,
  onClick,
}) => (
  <button
    onClick={onClick}
    title={collapsed ? item.label : undefined}
    className={`
      w-full flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg
      text-sm font-medium transition-all duration-200
      ${
        active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }
      ${collapsed ? 'justify-center mx-0 px-0' : ''}
    `}
  >
    {/* 图标 */}
    <span className={`flex-shrink-0 ${active ? 'text-white' : ''}`}>
      {item.icon}
    </span>

    {/* 文本 */}
    {!collapsed && (
      <span className="whitespace-nowrap flex-1 text-left">{item.label}</span>
    )}

    {/* 徽章 */}
    {!collapsed && item.badge !== undefined && (
      <span
        className={`
          px-2 py-0.5 text-xs font-medium rounded-full
          ${active ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}
        `}
      >
        {item.badge}
      </span>
    )}
  </button>
);

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

interface AdminSidebarProps {
  active: string;
  onChange: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  /** 移动端模式 */
  mobile?: boolean;
  /** 关闭移动端侧边栏 */
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  active,
  onChange,
  collapsed,
  onToggle,
  mobile = false,
  onClose,
}) => {
  // 按分组排序
  const groupedItems = Object.entries(groups)
    .map(([groupKey, groupConfig]) => ({
      ...groupConfig,
      items: navItems.filter((item) => item.group === groupKey),
    }))
    .sort((a, b) => a.order - b.order);

  return (
    <aside
      className={`
        bg-gray-900 text-gray-300 flex flex-col h-full
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'}
        ${mobile ? 'w-60' : ''}
      `}
    >
      {/* 顶部：Logo 区域 / 收起按钮 */}
      <div className="flex-shrink-0 p-3 border-b border-gray-800">
        {mobile && onClose ? (
          // 移动端：关闭按钮
          <button
            onClick={onClose}
            className="w-full flex items-center justify-between p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">芯</span>
              </div>
              <span className="text-white font-semibold">管理后台</span>
            </div>
            <X className="w-5 h-5" />
          </button>
        ) : (
          // 桌面端：收起/展开按钮
          <button
            onClick={onToggle}
            className={`
              w-full flex items-center gap-2 p-2 rounded-lg
              text-gray-400 hover:text-white hover:bg-gray-800 transition-colors
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? '展开菜单' : '收起菜单'}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 flex-shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm whitespace-nowrap">收起菜单</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 导航区域 */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {groupedItems.map((group) => (
          <div key={group.label} className="mb-4">
            {/* 分组标题 */}
            {!collapsed && (
              <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                {group.label}
              </div>
            )}

            {/* 导航项 */}
            {group.items.map((item) => (
              <NavItemButton
                key={item.id}
                item={item}
                active={active === item.id}
                collapsed={collapsed}
                onClick={() => {
                  onChange(item.id);
                  onClose?.();
                }}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* 底部信息 */}
      <div className="p-4 border-t border-gray-800">
        {!collapsed ? (
          <div className="text-xs text-gray-500">
            <div className="font-medium text-gray-400">芯核交易中心</div>
            <div className="mt-1">v2.0.0</div>
          </div>
        ) : (
          <div className="text-xs text-gray-600 text-center">v2.0</div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
