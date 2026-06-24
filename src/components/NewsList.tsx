import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Newspaper, TrendingUp, Clock, Eye, ArrowLeft } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  type: 'industry' | 'platform';
  coverImage?: string;
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
}

interface NewsListProps {
  onSelectNews: (id: string) => void;
}

export function NewsList({ onSelectNews }: NewsListProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'industry' | 'platform' | 'all'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadNews();
  }, [type, page]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const result = await api.getNews({
        type: type === 'all' ? undefined : type,
        page,
        pageSize: 10,
      });
      setNews(result.items);
      setTotal(result.total);
    } catch (err) {
      console.error('加载新闻失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTypeLabel = (t: string) => {
    return t === 'industry' ? '行业新闻' : '平台新闻';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 标题区 */}
      <div className="flex items-center gap-3 mb-6">
        <Newspaper className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">资讯中心</h1>
      </div>

      {/* 类型筛选 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setType('all'); setPage(1); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            type === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => { setType('industry'); setPage(1); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            type === 'industry'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          行业新闻
        </button>
        <button
          onClick={() => { setType('platform'); setPage(1); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            type === 'platform'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          平台新闻
        </button>
      </div>

      {/* 新闻列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : news.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无新闻</div>
      ) : (
        <div className="space-y-4">
          {news.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectNews(item.id)}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      item.type === 'industry' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {item.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.publishedAt || item.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.viewCount} 次阅读
                    </span>
                  </div>
                </div>
                {item.coverImage && (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-24 h-24 object-cover rounded-lg ml-4"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {total > 10 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-gray-600">
            第 {page} 页 / 共 {Math.ceil(total / 10)} 页
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 10)}
            className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

interface NewsDetailProps {
  newsId: string;
  onBack: () => void;
}

export function NewsDetail({ newsId, onBack }: NewsDetailProps) {
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, [newsId]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const result = await api.getNewsById(newsId);
      setNews(result);
    } catch (err) {
      console.error('加载新闻详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12 text-gray-500">
        加载中...
      </div>
    );
  }

  if (!news) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12 text-gray-500">
        新闻不存在
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 返回按钮 */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回列表
      </button>

      {/* 新闻详情 */}
      <article className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2 py-0.5 text-xs rounded ${
            news.type === 'industry' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {news.type === 'industry' ? '行业新闻' : '平台新闻'}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">{news.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-200">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDate(news.publishedAt || news.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {news.viewCount} 次阅读
          </span>
          {news.author && (
            <span>发布者: {news.author.companyName}</span>
          )}
        </div>

        {news.coverImage && (
          <img
            src={news.coverImage}
            alt={news.title}
            className="w-full max-h-96 object-cover rounded-lg mb-6"
          />
        )}

        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: news.content }}
        />
      </article>
    </div>
  );
}
