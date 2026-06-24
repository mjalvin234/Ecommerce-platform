/**
 * 新闻公告管理页面 - 现代化改造版
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Newspaper,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  X,
  FileText,
  Megaphone,
  Pin,
} from 'lucide-react';
import { api } from '../../api/client';
import { DataTable, Column, KPICard } from '../../components/admin-ui';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface News {
  id: string;
  title: string;
  content: string;
  type: 'industry' | 'platform';
  isPinned: boolean;
  isPublished: boolean;
  createdAt: string;
}

interface NewsManagementProps {
  showToast: (msg: string) => void;
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export const NewsManagement: React.FC<NewsManagementProps> = ({ showToast }) => {
  const [loading, setLoading] = useState(true);
  const [newsList, setNewsList] = useState<News[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'industry' as 'industry' | 'platform',
    isPinned: false,
  });

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await api.getNews({ page: 1, pageSize: 50 })) as any;
      setNewsList(result.items || result.news || result || []);
    } catch (err) {
      console.error('加载新闻失败:', err);
      showToast('加载新闻失败');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 提交
  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('请填写标题和内容');
      return;
    }

    try {
      if (editingNews) {
        await api.updateNews(editingNews.id, formData);
        showToast('新闻已更新');
      } else {
        await api.createNews(formData);
        showToast('新闻已发布');
      }
      closeEditor();
      loadData();
    } catch (err) {
      showToast('操作失败');
    }
  };

  // 删除
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条新闻吗？')) return;
    try {
      await api.deleteNews(id);
      showToast('新闻已删除');
      loadData();
    } catch (err) {
      showToast('删除失败');
    }
  };

  // 打开编辑器
  const openEditor = (news?: News) => {
    if (news) {
      setEditingNews(news);
      setFormData({
        title: news.title,
        content: news.content,
        type: news.type || 'industry',
        isPinned: news.isPinned || false,
      });
    } else {
      setEditingNews(null);
      setFormData({ title: '', content: '', type: 'industry', isPinned: false });
    }
    setShowEditor(true);
  };

  // 关闭编辑器
  const closeEditor = () => {
    setShowEditor(false);
    setEditingNews(null);
    setFormData({ title: '', content: '', type: 'industry', isPinned: false });
  };

  // 统计
  const stats = {
    total: newsList.length,
    published: newsList.filter((n) => n.isPublished).length,
    platform: newsList.filter((n) => n.type === 'platform').length,
    pinned: newsList.filter((n) => n.isPinned).length,
  };

  // 表格列定义
  const columns: Column<News>[] = [
    {
      key: 'title',
      title: '标题',
      render: (_, news) => (
        <div className="flex items-center gap-2">
          {news.isPinned && (
            <span className="px-1.5 py-0.5 text-xs bg-red-50 text-red-600 rounded font-medium flex items-center gap-1">
              <Pin className="w-3 h-3" />
              置顶
            </span>
          )}
          <span className="font-medium text-gray-900 truncate">{news.title}</span>
        </div>
      ),
    },
    {
      key: 'type',
      title: '类型',
      width: 100,
      render: (_, news) => (
        <span
          className={`admin-badge ${
            news.type === 'platform' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
          }`}
        >
          {news.type === 'platform' ? '平台公告' : '行业新闻'}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (_, news) => (
        <span className={`admin-badge ${news.isPublished ? 'admin-badge-success' : 'admin-badge-neutral'}`}>
          {news.isPublished ? '已发布' : '草稿'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: '发布时间',
      width: 140,
      hideOnMobile: true,
      render: (_, news) => (
        <span className="text-sm text-gray-500">{new Date(news.createdAt).toLocaleDateString('zh-CN')}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 120,
      align: 'right',
      render: (_, news) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditor(news);
            }}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(news.id);
            }}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新闻公告</h1>
          <p className="text-gray-500 mt-1 text-sm">发布和管理平台新闻与公告，共 {newsList.length} 条</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} disabled={loading} className="admin-btn admin-btn-secondary">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button onClick={() => openEditor()} className="admin-btn admin-btn-primary">
            <Plus className="w-4 h-4" />
            发布新闻
          </button>
        </div>
      </div>

      {/* KPI 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="全部新闻"
          value={stats.total.toLocaleString()}
          icon={<Newspaper className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="已发布"
          value={stats.published.toLocaleString()}
          icon={<FileText className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          title="平台公告"
          value={stats.platform.toLocaleString()}
          icon={<Megaphone className="w-5 h-5" />}
          color="orange"
        />
        <KPICard
          title="置顶"
          value={stats.pinned.toLocaleString()}
          icon={<Pin className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* 数据表格 */}
      <DataTable
        data={newsList}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyText="暂无新闻公告"
      />

      {/* 编辑器弹窗 */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeEditor}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingNews ? '编辑新闻' : '发布新闻'}
                </h3>
                <button
                  onClick={closeEditor}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 内容 */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="admin-input"
                    placeholder="请输入标题"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'industry' | 'platform' })}
                    className="admin-input"
                  >
                    <option value="industry">行业新闻</option>
                    <option value="platform">平台公告</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">内容</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="请输入内容..."
                    rows={10}
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPinned" className="text-sm text-gray-700 font-medium flex items-center gap-2">
                    <Pin className="w-4 h-4" />
                    置顶显示
                  </label>
                </div>
              </div>

              {/* 底部按钮 */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <button onClick={closeEditor} className="admin-btn admin-btn-secondary">
                  取消
                </button>
                <button onClick={handleSubmit} className="admin-btn admin-btn-primary">
                  {editingNews ? '保存修改' : '发布'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewsManagement;
