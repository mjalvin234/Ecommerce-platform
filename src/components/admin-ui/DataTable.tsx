/**
 * 数据表格组件 - 管理后台通用表格
 *
 * 特点：
 * - 响应式设计（移动端横向滚动）
 * - 批量选择功能
 * - 排序支持
 * - 加载骨架屏
 * - 空状态处理
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

export interface Column<T> {
  /** 列标识 */
  key: string;
  /** 列标题 */
  title: string;
  /** 列宽度 */
  width?: string | number;
  /** 是否可排序 */
  sortable?: boolean;
  /** 自定义渲染 */
  render?: (value: any, record: T, index: number) => React.ReactNode;
  /** 数据字段获取 */
  dataIndex?: keyof T;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 是否固定列 */
  fixed?: 'left' | 'right';
  /** 隐藏在移动端 */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  /** 数据源 */
  data: T[];
  /** 列定义 */
  columns: Column<T>[];
  /** 行唯一标识字段 */
  rowKey: keyof T | ((record: T) => string);
  /** 加载状态 */
  loading?: boolean;
  /** 是否可选择 */
  selectable?: boolean;
  /** 已选择的行 */
  selectedKeys?: string[];
  /** 选择变化回调 */
  onSelectChange?: (keys: string[]) => void;
  /** 分页配置 */
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
  };
  /** 分页变化回调 */
  onPageChange?: (page: number, pageSize: number) => void;
  /** 排序变化回调 */
  onSortChange?: (key: string, order: 'asc' | 'desc' | null) => void;
  /** 空状态文案 */
  emptyText?: string;
  /** 行点击事件 */
  onRowClick?: (record: T, index: number) => void;
  /** 行类名 */
  rowClassName?: (record: T, index: number) => string;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 表格大小 */
  size?: 'sm' | 'md' | 'lg';
}

// ═══════════════════════════════════════════════════════════════
// 骨架屏组件
// ═══════════════════════════════════════════════════════════════

const TableSkeleton: React.FC<{ columns: number; rows: number }> = ({
  columns,
  rows,
}) => (
  <tbody>
    {[...Array(rows)].map((_, rowIndex) => (
      <tr key={rowIndex} className="border-b border-gray-100">
        {[...Array(columns)].map((_, colIndex) => (
          <td key={colIndex} className="px-4 py-4">
            <div className="admin-skeleton h-4 w-full max-w-[120px]" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

// ═══════════════════════════════════════════════════════════════
// 空状态组件
// ═══════════════════════════════════════════════════════════════

const EmptyState: React.FC<{ text: string; columns: number }> = ({
  text,
  columns,
}) => (
  <tbody>
    <tr>
      <td colSpan={columns} className="px-4 py-12 text-center">
        <div className="text-gray-400 text-sm">{text}</div>
      </td>
    </tr>
  </tbody>
);

// ═══════════════════════════════════════════════════════════════
// 分页组件
// ═══════════════════════════════════════════════════════════════

interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  current,
  pageSize,
  total,
  onChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const pages = useMemo(() => {
    const result: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) result.push(i);
    } else {
      if (current <= 3) {
        result.push(1, 2, 3, 4, '...', totalPages);
      } else if (current >= totalPages - 2) {
        result.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        result.push(1, '...', current - 1, current, current + 1, '...', totalPages);
      }
    }
    return result;
  }, [current, totalPages]);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <div className="text-sm text-gray-500">
        共 <span className="font-medium text-gray-900">{total}</span> 条
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(current - 1)}
          disabled={current <= 1}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((page, index) =>
          typeof page === 'number' ? (
            <button
              key={index}
              onClick={() => onChange(page)}
              className={`min-w-[32px] h-8 px-2 text-sm font-medium rounded-lg transition-colors ${
                current === page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="px-1 text-gray-400">
              {page}
            </span>
          )
        )}
        <button
          onClick={() => onChange(current + 1)}
          disabled={current >= totalPages}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  rowKey,
  loading = false,
  selectable = false,
  selectedKeys = [],
  onSelectChange,
  pagination,
  onPageChange,
  onSortChange,
  emptyText = '暂无数据',
  onRowClick,
  rowClassName,
  bordered = false,
  size = 'md',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  // 获取行 key
  const getRowKey = (record: T): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return String(record[rowKey]);
  };

  // 排序处理
  const handleSort = (key: string) => {
    let newOrder: 'asc' | 'desc' | null = 'asc';
    if (sortKey === key) {
      if (sortOrder === 'asc') newOrder = 'desc';
      else if (sortOrder === 'desc') newOrder = null;
    }
    setSortKey(newOrder ? key : null);
    setSortOrder(newOrder);
    onSortChange?.(key, newOrder);
  };

  // 全选处理
  const handleSelectAll = () => {
    if (selectedKeys.length === data.length) {
      onSelectChange?.([]);
    } else {
      onSelectChange?.(data.map((record) => getRowKey(record)));
    }
  };

  // 单选处理
  const handleSelect = (key: string) => {
    const newKeys = selectedKeys.includes(key)
      ? selectedKeys.filter((k) => k !== key)
      : [...selectedKeys, key];
    onSelectChange?.(newKeys);
  };

  // 单元格 padding
  const cellPadding = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-5 py-4',
  }[size];

  // 可见列数（用于选择框）
  const visibleColumns = columns.filter((col) => !col.hideOnMobile);
  const totalColumns = columns.length + (selectable ? 1 : 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 工具栏 */}
      {selectedKeys.length > 0 && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700 font-medium">
              已选择 {selectedKeys.length} 项
            </span>
            <button
              onClick={() => onSelectChange?.([])}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              取消选择
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="admin-btn admin-btn-secondary text-sm">
              批量操作
            </button>
          </div>
        </div>
      )}

      {/* 表格容器 */}
      <div className="overflow-x-auto -mx-px">
        <table className="w-full min-w-[640px]">
          {/* 表头 */}
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {/* 选择框列 */}
              {selectable && (
                <th className={`${cellPadding} w-12`}>
                  <input
                    type="checkbox"
                    checked={selectedKeys.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}

              {/* 数据列 */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${cellPadding} text-left ${
                    column.sortable ? 'cursor-pointer select-none' : ''
                  } ${column.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div
                    className={`flex items-center gap-1 ${
                      column.align === 'center'
                        ? 'justify-center'
                        : column.align === 'right'
                        ? 'justify-end'
                        : ''
                    }`}
                  >
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {column.title}
                    </span>
                    {column.sortable && (
                      <span className="flex flex-col -space-y-1">
                        <ChevronUp
                          className={`w-3 h-3 ${
                            sortKey === column.key && sortOrder === 'asc'
                              ? 'text-blue-600'
                              : 'text-gray-300'
                          }`}
                        />
                        <ChevronDown
                          className={`w-3 h-3 ${
                            sortKey === column.key && sortOrder === 'desc'
                              ? 'text-blue-600'
                              : 'text-gray-300'
                          }`}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* 表体 */}
          {loading ? (
            <TableSkeleton columns={totalColumns} rows={5} />
          ) : data.length === 0 ? (
            <EmptyState text={emptyText} columns={totalColumns} />
          ) : (
            <tbody className="divide-y divide-gray-100">
              {data.map((record, index) => {
                const key = getRowKey(record);
                const isSelected = selectedKeys.includes(key);

                return (
                  <tr
                    key={key}
                    className={`${
                      isSelected ? 'bg-blue-50/50' : ''
                    } ${
                      onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50'
                    } transition-colors ${rowClassName?.(record, index) || ''}`}
                    onClick={() => onRowClick?.(record, index)}
                  >
                    {/* 选择框 */}
                    {selectable && (
                      <td className={cellPadding} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelect(key)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}

                    {/* 数据列 */}
                    {columns.map((column) => {
                      const value = column.dataIndex
                        ? record[column.dataIndex]
                        : undefined;
                      const content = column.render
                        ? column.render(value, record, index)
                        : value;

                      return (
                        <td
                          key={column.key}
                          className={`${cellPadding} ${
                            column.hideOnMobile ? 'hidden md:table-cell' : ''
                          }`}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {/* 分页 */}
      {pagination && onPageChange && (
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={(page) => onPageChange(page, pagination.pageSize)}
        />
      )}
    </div>
  );
}

export default DataTable;
