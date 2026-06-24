import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Star, Send, MessageSquare } from 'lucide-react';

interface ReviewFormProps {
  orderId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ orderId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('请输入评价内容');
      return;
    }

    setSubmitting(true);
    try {
      await api.createReview({ orderId, rating, content });
      alert('评价提交成功');
      onSuccess?.();
    } catch (err: any) {
      alert(err.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">评价订单</h3>

      {/* 星级评分 */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-2">评分</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-gray-600 self-center">
            {rating} 星
          </span>
        </div>
      </div>

      {/* 评价内容 */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-2">评价内容</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="请输入您的评价..."
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 提交按钮 */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        {submitting ? '提交中...' : '提交评价'}
      </button>
    </div>
  );
}

interface Review {
  id: string;
  rating: number;
  content: string;
  sellerReply?: string;
  repliedAt?: string;
  createdAt: string;
  buyer?: { id: string; companyName: string };
}

interface ReviewListProps {
  sellerId?: string;
  inventoryId?: string;
}

export function ReviewList({ sellerId, inventoryId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});

  useEffect(() => {
    loadReviews();
  }, [sellerId, inventoryId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      let result;
      if (sellerId) {
        result = await api.getSellerReviews();
      } else if (inventoryId) {
        result = await api.getInventoryReviews(inventoryId);
      }
      setReviews(result?.items || []);
    } catch (err) {
      console.error('加载评价失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId: string) => {
    const content = replyContent[reviewId];
    if (!content?.trim()) {
      alert('请输入回复内容');
      return;
    }

    try {
      await api.replyReview(reviewId, content);
      alert('回复成功');
      loadReviews();
    } catch (err: any) {
      alert(err.message || '回复失败');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">加载中...</div>;
  }

  if (reviews.length === 0) {
    return <div className="text-center py-8 text-gray-500">暂无评价</div>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {review.buyer?.companyName || '匿名用户'}
              </span>
            </div>
            <span className="text-sm text-gray-400">
              {new Date(review.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>

          <p className="text-gray-700 mb-3">{review.content}</p>

          {/* 卖家回复 */}
          {review.sellerReply ? (
            <div className="bg-gray-50 rounded-lg p-3 mt-3">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">卖家回复</span>
              </div>
              <p className="text-sm text-gray-600">{review.sellerReply}</p>
            </div>
          ) : sellerId ? (
            <div className="mt-3">
              <textarea
                value={replyContent[review.id] || ''}
                onChange={(e) => setReplyContent({ ...replyContent, [review.id]: e.target.value })}
                placeholder="输入回复内容..."
                rows={2}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              />
              <button
                onClick={() => handleReply(review.id)}
                className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                回复
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

interface SellerRatingProps {
  sellerId: string;
}

export function SellerRating({ sellerId }: SellerRatingProps) {
  const [stats, setStats] = useState<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [sellerId]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const result = await api.getSellerReviewStats(sellerId);
      setStats(result);
    } catch (err) {
      console.error('加载评分统计失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return null;
  }

  const total = stats.totalReviews;
  const distribution = stats.ratingDistribution;
  const maxCount = Math.max(...Object.values(distribution) as number[], 1);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        {/* 平均评分 */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="flex justify-center mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(stats.averageRating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {total} 条评价
          </div>
        </div>

        {/* 评分分布 */}
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-600 w-8">{rating}星</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 rounded-full h-2"
                  style={{ width: `${(distribution[rating as keyof typeof distribution] / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 w-8">
                {distribution[rating as keyof typeof distribution]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
