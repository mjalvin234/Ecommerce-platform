import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

export type NewsType = 'industry' | 'platform';
export type NewsStatus = 'draft' | 'published' | 'archived';

@Entity('news')
export class News {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'industry'
  })
  type: NewsType;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'draft'
  })
  status: NewsStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImage: string;

  @Column({ type: 'varchar' })
  authorId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'authorId' })
  author: any;

  @Column({ type: 'integer', default: 0 })
  viewCount: number;

  @Column({ type: 'datetime', nullable: true })
  publishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
