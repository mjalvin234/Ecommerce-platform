/**
 * KPI 卡片组件 - 管理后台数据展示
 *
 * 特点：
 * - 支持 4 种主题色
 * - 支持趋势指标（上涨/下跌）
 * - 响应式设计
 * - 悬浮动效
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KPICardProps {
  /** 标题 */
  title: string;
  /** 主数值 */
  value: string | number;
  /** 图标 */
  icon: React.ReactNode;
  /** 主题色 */
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  /** 趋势数据 */
  trend?: {
    value: number;
    type: 'up' | 'down' | 'neutral';
    label?: string;
  };
  /** 副标题/附加信息 */
  subtitle?: string;
  /** 加载状态 */
  loading?: boolean;
  /** 点击事件 */
  onClick?: () => void;
}

const colorConfig = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    trend: 'text-green-600',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    trend: 'text-purple-600',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    trend: 'text-orange-600',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    trend: 'text-red-600',
  },
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  color = 'blue',
  trend,
  subtitle,
  loading = false,
  onClick,
}) => {
  const colors = colorConfig[color];

  if (loading) {
    return (
      <div className="admin-kpi-card p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="admin-skeleton h-4 w-20" />
            <div className="admin-skeleton h-8 w-28" />
            <div className="admin-skeleton h-3 w-16" />
          </div>
          <div className="admin-skeleton h-12 w-12 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`admin-kpi-card p-5 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 font-mono tracking-tight">
            {value}
          </p>

          {/* 趋势指标 */}
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              {trend.type === 'up' && (
                <TrendingUp className="w-4 h-4 text-green-600" />
              )}
              {trend.type === 'down' && (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              {trend.type === 'neutral' && (
                <Minus className="w-4 h-4 text-gray-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  trend.type === 'up'
                    ? 'text-green-600'
                    : trend.type === 'down'
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-gray-400 ml-1">{trend.label}</span>
              )}
            </div>
          )}

          {/* 副标题 */}
          {subtitle && !trend && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>

        {/* 图标 */}
        <div className={`p-3 rounded-xl ${colors.bg} ${colors.text} flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
