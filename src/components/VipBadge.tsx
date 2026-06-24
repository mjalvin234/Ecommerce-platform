import React from 'react';
import { Crown, Star, Award, Sparkles } from 'lucide-react';

interface VipBadgeProps {
  tagType: 'vip' | 'old_customer' | 'preferred';
  discountRate?: number;
  size?: 'small' | 'large';
  showLabel?: boolean;
  className?: string;
}

const tagConfig = {
  vip: {
    label: 'VIP客户',
    icon: Crown,
    bgClass: 'bg-gradient-to-r from-amber-500 to-yellow-400',
    textClass: 'text-amber-900',
    borderClass: 'border-amber-300',
    glowClass: 'shadow-amber-200/50',
  },
  old_customer: {
    label: '老客户',
    icon: Star,
    bgClass: 'bg-gradient-to-r from-blue-500 to-blue-400',
    textClass: 'text-blue-900',
    borderClass: 'border-blue-300',
    glowClass: 'shadow-blue-200/50',
  },
  preferred: {
    label: '优选客户',
    icon: Award,
    bgClass: 'bg-gradient-to-r from-purple-500 to-purple-400',
    textClass: 'text-purple-900',
    borderClass: 'border-purple-300',
    glowClass: 'shadow-purple-200/50',
  },
};

export const VipBadge: React.FC<VipBadgeProps> = ({
  tagType,
  discountRate,
  size = 'small',
  showLabel = true,
  className = '',
}) => {
  const config = tagConfig[tagType];
  const Icon = config.icon;

  if (size === 'small') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${config.bgClass} text-white shadow-md ${className}`}
        title={`${config.label}${discountRate ? ` - ${discountRate}折` : ''}`}
      >
        <Icon className="w-3 h-3" />
        {discountRate && <span>{discountRate}折</span>}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border-2 ${config.borderClass} ${config.bgClass} shadow-lg ${config.glowClass} ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-white/20 rounded-lg">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-white">
          <div className="font-bold flex items-center gap-1">
            {config.label}
            <Sparkles className="w-3 h-3" />
          </div>
          {discountRate && (
            <div className="text-xs opacity-90">专属折扣 {discountRate} 折</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const VipPriceTag: React.FC<{
  originalPrice: number;
  discountPrice: number;
  discountRate: number;
  tagType: 'vip' | 'old_customer' | 'preferred';
}> = ({ originalPrice, discountPrice, discountRate, tagType }) => {
  const config = tagConfig[tagType];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-baseline gap-2">
        <span className="font-mono font-bold text-xl text-red-600">
          ¥ {discountPrice.toFixed(2)}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${config.bgClass} text-white font-bold flex items-center gap-0.5`}>
          <Icon className="w-3 h-3" />
          {discountRate}折
        </span>
      </div>
      <div className="text-xs text-gray-400 line-through">
        ¥ {originalPrice.toFixed(2)}
      </div>
    </div>
  );
};

export const VipExclusiveTag: React.FC<{
  tagType: 'vip' | 'old_customer' | 'preferred';
}> = ({ tagType }) => {
  const config = tagConfig[tagType];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${config.bgClass} text-white text-xs font-bold shadow-sm`}>
      <Icon className="w-3 h-3" />
      老客户专享
    </span>
  );
};

export default VipBadge;
