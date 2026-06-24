import { AppDataSource } from '../config/database.js';
import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';

const reviewRepo = () => AppDataSource.getRepository(Review);
const orderRepo = () => AppDataSource.getRepository(Order);

export interface CreateReviewData {
  orderId: string;
  rating: number;
  content: string;
}

export interface SellerReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export const reviewService = {
  async create(buyerId: string, data: CreateReviewData) {
    // 验证订单
    const order = await orderRepo().findOne({
      where: { id: data.orderId }
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.buyerId !== buyerId) {
      throw new Error('无权评价此订单');
    }

    if (order.status !== 'completed') {
      throw new Error('只有已完成的订单才能评价');
    }

    // 检查是否已评价
    const existing = await reviewRepo().findOne({
      where: { orderId: data.orderId }
    });

    if (existing) {
      throw new Error('该订单已评价');
    }

    // 验证评分
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('评分必须在1-5之间');
    }

    const review = reviewRepo().create({
      orderId: data.orderId,
      buyerId,
      sellerId: order.sellerId,
      inventoryId: order.inventoryId,
      rating: data.rating,
      content: data.content
    });

    return await reviewRepo().save(review);
  },

  async getByInventory(inventoryId: string, page: number = 1, pageSize: number = 10) {
    const [items, total] = await reviewRepo().findAndCount({
      where: { inventoryId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: ['buyer']
    });

    return { items, total, page, pageSize };
  },

  async getBySeller(sellerId: string, page: number = 1, pageSize: number = 10) {
    const [items, total] = await reviewRepo().findAndCount({
      where: { sellerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: ['buyer', 'inventory']
    });

    return { items, total, page, pageSize };
  },

  async reply(sellerId: string, reviewId: string, content: string) {
    const review = await reviewRepo().findOne({
      where: { id: reviewId }
    });

    if (!review) {
      throw new Error('评价不存在');
    }

    if (review.sellerId !== sellerId) {
      throw new Error('无权回复此评价');
    }

    if (review.sellerReply) {
      throw new Error('已回复过此评价');
    }

    review.sellerReply = content;
    review.repliedAt = new Date();

    return await reviewRepo().save(review);
  },

  async getSellerStats(sellerId: string): Promise<SellerReviewStats> {
    const reviews = await reviewRepo().find({
      where: { sellerId },
      select: ['rating']
    });

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = Math.round((sum / totalReviews) * 10) / 10;

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const rating = r.rating as keyof typeof ratingDistribution;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });

    return { averageRating, totalReviews, ratingDistribution };
  },

  async getById(id: string) {
    return await reviewRepo().findOne({
      where: { id },
      relations: ['buyer', 'seller', 'inventory', 'order']
    });
  },

  async getBuyerReviews(buyerId: string, page: number = 1, pageSize: number = 10) {
    const [items, total] = await reviewRepo().findAndCount({
      where: { buyerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: ['seller', 'inventory']
    });

    return { items, total, page, pageSize };
  }
};
