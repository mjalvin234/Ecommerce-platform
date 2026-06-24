/**
 * 管理后台 - 顶部栏
 *
 * 改造要点：
 * - 移动端适配
 * - 通知中心优化
 * - 搜索功能
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  LogOut,
  Bell,
  Menu,
  Search,
  CheckCircle,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface User {
  id: string;
  email: string;
  companyName: string;
  role: string;
}

interface AdminHeaderProps {
  user: User;
  onLogout: () => void;
  /** 移动端菜单按钮 */
  onMenuClick?: () => void;
  /** 是否显示移动端菜单按钮 */
  showMenuButton?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  user,
  onLogout,
  onMenuClick,
  showMenuButton = false,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm relative z-50">
      {/* 左侧 */}
      <div className="flex items-center gap-3">
        {/* 移动端菜单按钮 */}
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Logo - 仅移动端显示 */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">芯</span>
          </div>
          <span className="font-semibold text-gray-900">管理后台</span>
        </div>

        {/* 搜索框 - 桌面端 */}
        <div ref={searchRef} className="hidden lg:block relative">
          {showSearch ? (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索..."
                autoFocus
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden xl:inline">搜索...</span>
            </button>
          )}
        </div>
      </div>

      {/* 右侧 */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* 通知 */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* 通知面板 */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-medium text-gray-900">通知消息</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    全部已读
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    暂无通知
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-gray-900">
                              {notification.title}
                            </span>
                            <span className="text-xs text-gray-400">
                              {notification.time}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 用户菜单 */}
        <div className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-4 border-l border-gray-200">
          {/* 用户信息 - 桌面端 */}
          <div className="hidden lg:block text-right">
            <div className="text-sm font-medium text-gray-900">
              {user.companyName}
            </div>
            <div className="text-xs text-gray-500">管理员</div>
          </div>

          {/* 头像 */}
          <div className="w-8 h-8 lg:w-9 lg:h-9 bg-gray-900 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {user.companyName?.charAt(0) || 'A'}
            </span>
          </div>

          {/* 退出按钮 - 桌面端 */}
          <button
            onClick={onLogout}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
            <span>退出</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
