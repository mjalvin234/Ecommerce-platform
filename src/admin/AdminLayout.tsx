/**
 * 管理后台 - 主布局
 *
 * 改造要点：
 * - 移动端响应式（Drawer 侧边栏）
 * - 页面切换动画
 * - 性能优化
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { Dashboard } from './pages/Dashboard';
import { UserManagement } from './pages/UserManagement';
import { CertificationReview } from './pages/CertificationReview';
import { CreditManagement } from './pages/CreditManagement';
import { OrderManagement } from './pages/OrderManagement';
import { InventoryManagement } from './pages/InventoryManagement';
import { SettlementReview } from './pages/SettlementReview';
import { CorporatePayment } from './pages/CorporatePayment';
import { PaymentConfig } from './pages/PaymentConfig';
import { NewsManagement } from './pages/NewsManagement';
import { QaManagement } from './pages/QaManagement';
import { QualityReports } from './pages/QualityReports';
import { SystemSettings } from './pages/SystemSettings';

// 复用现有组件
import { ApiManagement } from '../components/ApiManagement';
import { WebhookManagement } from '../components/WebhookManagement';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface User {
  id: string;
  email: string;
  companyName: string;
  role: string;
}

interface AdminLayoutProps {
  user: User;
  onLogout: () => void;
  showToast: (msg: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// 页面切换动画配置
// ═══════════════════════════════════════════════════════════════

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.2,
};

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  user,
  onLogout,
  showToast,
}) => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 检测屏幕尺寸，自动收起侧边栏
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 渲染页面内容
  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard showToast={showToast} />;
      case 'users':
        return <UserManagement showToast={showToast} />;
      case 'certification':
        return <CertificationReview showToast={showToast} />;
      case 'credit':
        return <CreditManagement showToast={showToast} />;
      case 'orders':
        return <OrderManagement showToast={showToast} />;
      case 'inventory':
        return <InventoryManagement showToast={showToast} />;
      case 'settlement':
        return <SettlementReview showToast={showToast} />;
      case 'corporate-payment':
        return <CorporatePayment showToast={showToast} />;
      case 'payment-config':
        return <PaymentConfig showToast={showToast} />;
      case 'news':
        return <NewsManagement showToast={showToast} />;
      case 'qa':
        return <QaManagement showToast={showToast} />;
      case 'quality-reports':
        return <QualityReports showToast={showToast} />;
      case 'api':
        return <ApiManagement showToast={showToast} />;
      case 'webhook':
        return <WebhookManagement showToast={showToast} />;
      case 'settings':
        return <SystemSettings showToast={showToast} />;
      default:
        return <Dashboard showToast={showToast} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* 顶部栏 - 固定 */}
      <AdminHeader
        user={user}
        onLogout={onLogout}
        onMenuClick={() => setMobileSidebarOpen(true)}
        showMenuButton={true}
      />

      {/* 主体区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 桌面端侧边栏 */}
        <div className="hidden lg:block relative flex-shrink-0">
          <AdminSidebar
            active={activeModule}
            onChange={setActiveModule}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* 移动端侧边栏 - Drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              {/* 遮罩层 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setMobileSidebarOpen(false)}
              />

              {/* 侧边栏 */}
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
                className="lg:hidden fixed left-0 top-0 bottom-0 w-60 z-50"
              >
                <AdminSidebar
                  active={activeModule}
                  onChange={setActiveModule}
                  collapsed={false}
                  onToggle={() => {}}
                  mobile={true}
                  onClose={() => setMobileSidebarOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 右侧内容区 - 独立滚动 */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              transition={pageTransition}
              className="p-4 lg:p-6 min-h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
