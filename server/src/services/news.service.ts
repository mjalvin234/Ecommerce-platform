import { AppDataSource } from '../config/database.js';
import { News, NewsType, NewsStatus } from '../models/News.js';
import { Like } from 'typeorm';

const newsRepo = () => AppDataSource.getRepository(News);

export interface CreateNewsData {
  title: string;
  content: string;
  type: NewsType;
  coverImage?: string;
  authorId: string;
}

export interface NewsQuery {
  type?: NewsType;
  status?: NewsStatus;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export const newsService = {
  async create(data: CreateNewsData) {
    const news = newsRepo().create({
      ...data,
      status: 'draft',
      viewCount: 0
    });
    return await newsRepo().save(news);
  },

  async getList(query: NewsQuery) {
    const { type, status, keyword, page = 1, pageSize = 10 } = query;
    const where: any = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (keyword) where.title = Like(`%${keyword}%`);

    const [items, total] = await newsRepo().findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: ['author']
    });

    return { items, total, page, pageSize };
  },

  async getById(id: string, incrementView = false) {
    const news = await newsRepo().findOne({
      where: { id },
      relations: ['author']
    });

    if (news && incrementView) {
      news.viewCount += 1;
      await newsRepo().save(news);
    }

    return news;
  },

  async update(id: string, data: Partial<CreateNewsData>) {
    const news = await newsRepo().findOneBy({ id });
    if (!news) throw new Error('新闻不存在');

    Object.assign(news, data);
    return await newsRepo().save(news);
  },

  async delete(id: string) {
    const result = await newsRepo().delete(id);
    return (result.affected ?? 0) > 0;
  },

  async publish(id: string) {
    const news = await newsRepo().findOneBy({ id });
    if (!news) throw new Error('新闻不存在');

    news.status = 'published';
    news.publishedAt = new Date();
    return await newsRepo().save(news);
  },

  async archive(id: string) {
    const news = await newsRepo().findOneBy({ id });
    if (!news) throw new Error('新闻不存在');

    news.status = 'archived';
    return await newsRepo().save(news);
  },

  async getPublishedList(type?: NewsType, limit = 10) {
    const where: any = { status: 'published' };
    if (type) where.type = type;

    return await newsRepo().find({
      where,
      order: { publishedAt: 'DESC' },
      take: limit
    });
  }
};
