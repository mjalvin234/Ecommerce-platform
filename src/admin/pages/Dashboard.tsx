/**
 * 管理后台 - 数据概览页
 *
 * 改造要点：
 * - 使用新的 KPICard 组件
 * - 使用 Recharts 图表库（懒加载）
 * - 响应式布局
 * - 加载骨架屏
 * - 时间范围筛选（只刷新订单趋势图表）
 */

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../api/client';
import { KPICard } from '../../components/admin-ui';

// 懒加载图表组件
const OrderTrendChart = lazy(() =>
  import('../../components/admin-ui/Charts').then((m) => ({ default: m.OrderTrendChart }))
);
const UserDistributionChart = lazy(() =>
  import('../../components/admin-ui/Charts').then((m) => ({ default: m.UserDistributionChart }))
);
const PopularModelsChart = lazy(() =>
  import('../../components/admin-ui/Charts').then((m) => ({ default: m.PopularModelsChart }))
);
const StatusChart = lazy(() =>
  import('../../components/admin-ui/Charts').then((m) => ({ default: m.StatusChart }))
);

// 图表加载占位符
const ChartPlaceholder = () => (
  <div className="admin-chart-container">
    <div className="animate-pulse space-y-4">
      <div className="h-5 w-24 bg-gray-200 rounded" />
      <div className="h-48 w-full bg-gray-100 rounded" />
    </div>
  </div>
);

interface DashboardProps {
  showToast: (msg: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const Dashboard: React.FC<DashboardProps> = ({ showToast }) => {
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false); // 订单趋势单独的加载状态
  const [stats, setStats] = useState<any>(null);
  const [orderTrend, setOrderTrend] = useState<any[]>([]);
  const [topModels, setTopModels] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // 格式化金额
  const formatMoney = useCallback((amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  // 加载订单趋势数据（单独）
  const loadTrendData = useCallback(async (range: '7d' | '30d' | '90d') => {
    setTrendLoading(true);
    try {
      const trend = await api.getOrderTrend(range);
      setOrderTrend(trend);
    } catch (err) {
      console.error('加载订单趋势失败:', err);
    } finally {
      setTrendLoading(false);
    }
  }, []);

  // 加载所有数据（初始加载）
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statistics, trend, models] = await Promise.all([
        api.getAdminStatistics(),
        api.getOrderTrend(timeRange),
        api.getTopModels(10),
      ]);
      setStats(statistics);
      setOrderTrend(trend);
      setTopModels(models);
    } catch (err) {
      console.error('加载数据失败:', err);
      showToast('加载数据失败，请检查权限');
    } finally {
      setLoading(false);
    }
  }, [showToast, timeRange]);

  // 初始加载
  useEffect(() => {
    loadData();
  }, []);

  // 处理时间范围切换
  const handleTimeRangeChange = useCallback((range: '7d' | '30d' | '90d') => {
    setTimeRange(range);
    loadTrendData(range);
  }, [loadTrendData]);

  // 计算趋势
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, type: 'neutral' as const };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.round(change * 10) / 10,
      type: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const,
    };
  };

  // KPI 数据
  const kpiData = stats
    ? [
        {
          title: '用户总数',
          value: stats.users.total.toLocaleString(),
          icon: <Users className="w-5 h-5" />,
          color: 'blue' as const,
          trend: calculateTrend(stats.users.total, stats.users.total - stats.users.newToday),
          subtitle: '较昨日',
        },
        {
          title: '订单总数',
          value: stats.orders.total.toLocaleString(),
          icon: <Package className="w-5 h-5" />,
          color: 'green' as const,
          trend: calculateTrend(stats.orders.total, stats.orders.total - stats.orders.newToday),
          subtitle: '较昨日',
        },
        {
          title: '交易总额',
          value: formatMoney(stats.transactions.totalAmount),
          icon: <DollarSign className="w-5 h-5" />,
          color: 'purple' as const,
          subtitle: `本月: ${formatMoney(stats.transactions.monthAmount)}`,
        },
        {
          title: '待处理事项',
          value: (
            stats.orders.pendingPayment +
            stats.orders.pendingShipment +
            stats.users.pendingVerification
          ).toLocaleString(),
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'orange' as const,
          subtitle: '付款/发货/认证',
        },
      ]
    : [];

  // 用户分布数据
  const userDistributionData = stats
    ? [
        { name: '采购商', value: stats.users.buyers, color: '#3B82F6' },
        { name: '供应商', value: stats.users.sellers, color: '#8B5CF6' },
        { name: '待认证', value: stats.users.pendingVerification, color: '#F97316' },
      ]
    : [];

  // 订单状态数据
  const orderStatusData = stats
    ? [
        { name: '待付款', value: stats.orders.pendingPayment, color: '#F59E0B' },
        { name: '待发货', value: stats.orders.pendingShipment, color: '#F97316' },
        { name: '已完成', value: stats.orders.completed, color: '#10B981' },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据概览</h1>
          <p className="text-gray-500 mt-1 text-sm">平台运营数据实时监控</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="admin-btn admin-btn-secondary"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新数据
        </button>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [...Array(4)].map((_, i) => (
              <KPICard key={i} title="" value="" icon={<div />} loading />
            ))
          : kpiData.map((kpi, index) => (
              <KPICard
                key={index}
                title={kpi.title}
                value={kpi.value}
                icon={kpi.icon}
                color={kpi.color}
                trend={kpi.trend}
                subtitle={kpi.subtitle}
              />
            ))}
      </div>

      {/* 图表区域 - 第一行 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 订单趋势 */}
        <Suspense fallback={<ChartPlaceholder />}>
          <OrderTrendChart
            data={orderTrend}
            title="订单趋势"
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
            loading={trendLoading}
          />
        </Suspense>

        {/* 用户分布 */}
        <Suspense fallback={<ChartPlaceholder />}>
          <UserDistributionChart
            data={userDistributionData}
            title="用户分布"
            loading={loading}
          />
        </Suspense>
      </div>

      {/* 图表区域 - 第二行 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 订单状态 */}
        <Suspense fallback={<ChartPlaceholder />}>
          <StatusChart
            data={orderStatusData}
            title="订单状态"
            loading={loading}
          />
        </Suspense>

        {/* 热门型号 */}
        <Suspense fallback={<ChartPlaceholder />}>
          <PopularModelsChart
            data={topModels}
            title="热门型号 TOP 10"
            loading={loading}
          />
        </Suspense>
      </div>

      {/* 快捷入口 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">快捷操作</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '待认证用户', count: stats?.users.pendingVerification || 0, color: 'orange' },
            { label: '待付款订单', count: stats?.orders.pendingPayment || 0, color: 'red' },
            { label: '待发货订单', count: stats?.orders.pendingShipment || 0, color: 'yellow' },
            { label: '待审核结算', count: 0, color: 'blue' },
          ].map((item) => (
            <button
              key={item.label}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <span className="text-sm text-gray-600">{item.label}</span>
              <span
                className={`text-sm font-mono font-semibold ${
                  item.color === 'orange'
                    ? 'text-orange-600'
                    : item.color === 'red'
                    ? 'text-red-600'
                    : item.color === 'yellow'
                    ? 'text-yellow-600'
                    : 'text-blue-600'
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
