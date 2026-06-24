import React from 'react';
import { TrendingDown, Check } from 'lucide-react';

interface TieredPriceDisplayProps {
  tiers: Array<{
    minQuantity: number;
    maxQuantity: number | null;
    unitPrice: number;
    discountRate?: number;
  }>;
  basePrice: number;
  selectedQuantity?: number;
  compact?: boolean;
}

export const TieredPriceDisplay: React.FC<TieredPriceDisplayProps> = ({
  tiers,
  basePrice,
  selectedQuantity,
  compact = false,
}) => {
  if (!tiers || tiers.length === 0) return null;

  if (compact) {
    // 紧凑模式，用于列表页
    const minPrice = Math.min(...tiers.map(t => t.unitPrice));
    const maxDiscount = Math.round((1 - minPrice / basePrice) * 100);

    return (
      <div className="flex items-center gap-1">
        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
          <TrendingDown className="w-3 h-3" />
          阶梯价
        </span>
        <span className="text-xs text-green-600 font-mono">¥{minPrice.toFixed(2)}起</span>
        <span className="text-xs text-gray-400">省{maxDiscount}%</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
      <div className="flex items-center gap-2 mb-3">
        <TrendingDown className="w-5 h-5 text-green-600" />
        <span className="font-bold text-green-800">批量采购优惠</span>
      </div>

      <div className="space-y-2">
        {tiers.map((tier, index) => {
          const isActive = selectedQuantity !== undefined &&
            selectedQuantity >= tier.minQuantity &&
            (tier.maxQuantity === null || selectedQuantity <= tier.maxQuantity);

          const discount = basePrice > 0
            ? Math.round((1 - tier.unitPrice / basePrice) * 100)
            : 0;

          return (
            <div
              key={index}
              className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-green-100 border border-green-300'
                  : 'bg-white/50'
              }`}
            >
              <div className="flex items-center gap-2">
                {isActive && <Check className="w-4 h-4 text-green-600" />}
                <span className={`text-sm ${isActive ? 'font-bold text-green-800' : 'text-gray-600'}`}>
                  {tier.minQuantity}-{tier.maxQuantity || '∞'} 件
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold ${isActive ? 'text-green-700 text-lg' : 'text-gray-700'}`}>
                  ¥{tier.unitPrice.toFixed(2)}/件
                </span>
                {discount > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    isActive
                      ? 'bg-green-500 text-white'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    省{discount}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-green-200 text-xs text-green-700">
        💡 购买越多，单价越低
      </div>
    </div>
  );
};

export default TieredPriceDisplay;
