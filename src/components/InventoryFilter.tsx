import React, { useState, useEffect } from 'react';

interface FilterOptions {
  brands: string[];
  years: string[];
  locations: string[];
  priceRanges: { label: string; min: number; max: number }[];
}

interface FilterState {
  brand: string;
  year: string;
  location: string;
  priceRange: string;
  acceptNegotiation: boolean | null;
}

interface InventoryFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

export const InventoryFilter: React.FC<InventoryFilterProps> = ({ onFilterChange }) => {
  const [options, setOptions] = useState<FilterOptions>({
    brands: ['TI', 'ST', 'ADI', 'Xilinx', 'Intel', 'NXP', 'Microchip', 'Infineon', 'Renesas', '其他'],
    years: ['2025+', '2024', '2023', '2022', '2021', '2020', '2019', '更早'],
    locations: ['深圳', '上海', '北京', '广州', '杭州', '成都', '其他'],
    priceRanges: [
      { label: '全部价格', min: 0, max: Infinity },
      { label: '¥0 - ¥10', min: 0, max: 10 },
      { label: '¥10 - ¥100', min: 10, max: 100 },
      { label: '¥100 - ¥1000', min: 100, max: 1000 },
      { label: '¥1000+', min: 1000, max: Infinity },
    ],
  });

  const [filters, setFilters] = useState<FilterState>({
    brand: '',
    year: '',
    location: '',
    priceRange: '',
    acceptNegotiation: null,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof FilterState, value: string | boolean | null) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      brand: '',
      year: '',
      location: '',
      priceRange: '',
      acceptNegotiation: null,
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== null);

  return (
    <div className="bg-white rounded-lg shadow mb-4">
      {/* 简洁筛选栏 */}
      <div className="p-4 flex flex-wrap items-center gap-4">
        {/* 品牌 */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">品牌:</label>
          <select
            value={filters.brand}
            onChange={(e) => handleFilterChange('brand', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部品牌</option>
            {options.brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        {/* 年份 */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">年份:</label>
          <select
            value={filters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部年份</option>
            {options.years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* 地区 */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">地区:</label>
          <select
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部地区</option>
            {options.locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* 展开/收起按钮 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          {isExpanded ? '收起' : '更多筛选'}
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 清除筛选 */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            清除筛选
          </button>
        )}
      </div>

      {/* 扩展筛选 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 价格区间 */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">价格区间</label>
              <div className="flex flex-wrap gap-2">
                {options.priceRanges.map(range => (
                  <button
                    key={range.label}
                    onClick={() => handleFilterChange('priceRange', filters.priceRange === range.label ? '' : range.label)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      filters.priceRange === range.label
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 议价选项 */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">议价选项</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFilterChange('acceptNegotiation', filters.acceptNegotiation === true ? null : true)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.acceptNegotiation === true
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  接受议价
                </button>
                <button
                  onClick={() => handleFilterChange('acceptNegotiation', filters.acceptNegotiation === false ? null : false)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.acceptNegotiation === false
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  一口价
                </button>
              </div>
            </div>

            {/* 快捷筛选 */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">快捷筛选</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setFilters({
                      brand: '',
                      year: '2025+',
                      location: '',
                      priceRange: '',
                      acceptNegotiation: true,
                    });
                  }}
                  className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                >
                  🔥 最新年份
                </button>
                <button
                  onClick={() => {
                    setFilters({
                      brand: 'TI',
                      year: '',
                      location: '',
                      priceRange: '',
                      acceptNegotiation: null,
                    });
                  }}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                  TI 品牌
                </button>
                <button
                  onClick={() => {
                    setFilters({
                      brand: '',
                      year: '',
                      location: '深圳',
                      priceRange: '',
                      acceptNegotiation: null,
                    });
                  }}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                >
                  深圳现货
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 活动筛选标签 */}
      {hasActiveFilters && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {filters.brand && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
              品牌: {filters.brand}
              <button onClick={() => handleFilterChange('brand', '')} className="hover:text-blue-900">×</button>
            </span>
          )}
          {filters.year && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1">
              年份: {filters.year}
              <button onClick={() => handleFilterChange('year', '')} className="hover:text-green-900">×</button>
            </span>
          )}
          {filters.location && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center gap-1">
              地区: {filters.location}
              <button onClick={() => handleFilterChange('location', '')} className="hover:text-purple-900">×</button>
            </span>
          )}
          {filters.priceRange && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center gap-1">
              价格: {filters.priceRange}
              <button onClick={() => handleFilterChange('priceRange', '')} className="hover:text-orange-900">×</button>
            </span>
          )}
          {filters.acceptNegotiation !== null && (
            <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs flex items-center gap-1">
              {filters.acceptNegotiation ? '接受议价' : '一口价'}
              <button onClick={() => handleFilterChange('acceptNegotiation', null)} className="hover:text-teal-900">×</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryFilter;
