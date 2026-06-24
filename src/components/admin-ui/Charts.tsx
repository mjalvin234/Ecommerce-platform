/**
 * 图表组件封装 - 基于 Recharts
 *
 * 包含：
 * - OrderTrendChart: 订单趋势图（面积图）
 * - UserDistributionChart: 用户分布图（饼图）
 * - PopularModelsChart: 热门型号图（横向柱状图）
 * - StatusChart: 状态分布图（环形图）
 */

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, Users, Package, DollarSign } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// 通用配置
// ═══════════════════════════════════════════════════════════════

const COLORS = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  accent: '#F97316',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

const CHART_COLORS = ['#3B82F6', '#8B5CF6', '#F97316', '#10B981', '#F59E0B'];

// 自定义 Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="font-mono font-medium">
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════
// 订单趋势图
// ═══════════════════════════════════════════════════════════════

interface TrendDataItem {
  date: string;
  count: number;
  amount?: number;
}

interface OrderTrendChartProps {
  data: TrendDataItem[];
  title?: string;
  showAmount?: boolean;
  loading?: boolean;
  timeRange?: '7d' | '30d' | '90d';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d') => void;
}

export const OrderTrendChart: React.FC<OrderTrendChartProps> = ({
  data,
  title = '订单趋势',
  showAmount = false,
  loading = false,
  timeRange = '7d',
  onTimeRangeChange,
}) => {
  return (
    <div className="admin-chart-container">
      {/* 标题和时间范围选择 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          {onTimeRangeChange && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => onTimeRangeChange(range)}
                  disabled={loading}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    timeRange === range
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  } ${loading ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  {range === '7d' ? '7天' : range === '30d' ? '30天' : '90天'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 图表 */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            name="订单数"
            stroke={COLORS.primary}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCount)"
          />
          {showAmount && (
            <Area
              type="monotone"
              dataKey="amount"
              name="金额"
              stroke={COLORS.success}
              strokeWidth={2}
              fill="transparent"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 用户分布图
// ═══════════════════════════════════════════════════════════════

interface DistributionDataItem {
  name: string;
  value: number;
  color?: string;
}

interface UserDistributionChartProps {
  data: DistributionDataItem[];
  title?: string;
  loading?: boolean;
}

export const UserDistributionChart: React.FC<UserDistributionChartProps> = ({
  data,
  title = '用户分布',
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="admin-chart-container">
        <div className="admin-skeleton h-5 w-24 mb-4" />
        <div className="flex items-center gap-6">
          <div className="admin-skeleton h-28 w-28 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="admin-skeleton h-4 w-full" />
            <div className="admin-skeleton h-4 w-3/4" />
            <div className="admin-skeleton h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="admin-chart-container">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-gray-400" />
        {title}
      </h3>

      <div className="flex items-center gap-6">
        {/* 饼图 */}
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={data}
              cx={60}
              cy={60}
              innerRadius={35}
              outerRadius={55}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* 图例 */}
        <div className="flex-1 space-y-3">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: item.color || CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-semibold text-gray-900">
                  {item.value.toLocaleString()}
                </span>
                <span className="text-xs text-gray-400">
                  {total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : '0%'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 热门型号图
// ═══════════════════════════════════════════════════════════════

interface PopularModelItem {
  partNumber: string;
  count: number;
}

interface PopularModelsChartProps {
  data: PopularModelItem[];
  title?: string;
  loading?: boolean;
  maxItems?: number;
}

export const PopularModelsChart: React.FC<PopularModelsChartProps> = ({
  data,
  title = '热门型号 TOP 10',
  loading = false,
  maxItems = 10,
}) => {
  const displayData = data.slice(0, maxItems);

  if (loading) {
    return (
      <div className="admin-chart-container">
        <div className="admin-skeleton h-5 w-32 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3">
              <div className="admin-skeleton h-3 w-6 mb-2" />
              <div className="admin-skeleton h-4 w-full mb-1" />
              <div className="admin-skeleton h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-chart-container">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Package className="w-4 h-4 text-gray-400" />
        {title}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {displayData.map((model, index) => (
          <div
            key={model.partNumber}
            className="bg-gray-50 rounded-lg p-3 text-center hover:bg-gray-100 transition-colors"
          >
            <div className="text-xs text-gray-400 mb-1">#{index + 1}</div>
            <div className="font-mono text-sm font-bold text-gray-900 truncate" title={model.partNumber}>
              {model.partNumber}
            </div>
            <div className="text-xs text-gray-500 mt-1">{model.count} 次</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 状态分布图（环形图）
// ═══════════════════════════════════════════════════════════════

interface StatusDataItem {
  name: string;
  value: number;
  color: string;
}

interface StatusChartProps {
  data: StatusDataItem[];
  title?: string;
  loading?: boolean;
}

export const StatusChart: React.FC<StatusChartProps> = ({
  data,
  title = '状态分布',
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="admin-chart-container">
        <div className="admin-skeleton h-5 w-24 mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="admin-skeleton h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="admin-chart-container">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{item.name}</span>
              <span className="text-sm font-mono font-semibold text-gray-900">
                {item.value.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 交易金额图
// ═══════════════════════════════════════════════════════════════

interface AmountDataItem {
  name: string;
  amount: number;
}

interface AmountChartProps {
  data: AmountDataItem[];
  title?: string;
  loading?: boolean;
  formatValue?: (value: number) => string;
}

export const AmountChart: React.FC<AmountChartProps> = ({
  data,
  title = '交易金额',
  loading = false,
  formatValue = (v) => `¥${v.toLocaleString()}`,
}) => {
  if (loading) {
    return (
      <div className="admin-chart-container">
        <div className="admin-skeleton h-5 w-24 mb-4" />
        <div className="admin-skeleton h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="admin-chart-container">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-gray-400" />
        {title}
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 10000) return `${(value / 10000).toFixed(0)}万`;
              return value;
            }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                    <p className="text-gray-400 mb-1">{label}</p>
                    <p className="font-mono font-medium">
                      {formatValue(payload[0].value as number)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="amount"
            fill={COLORS.primary}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default {
  OrderTrendChart,
  UserDistributionChart,
  PopularModelsChart,
  StatusChart,
  AmountChart,
};
