import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique, Index } from 'typeorm';

/**
 * 关注实体 - 用户关注其他用户（通常是买家关注卖家）
 */
@Entity('follows')
@Unique(['followerId', 'followingId']) // 不能重复关注同一用户
@Index(['followerId'])
@Index(['followingId'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  followerId!: string; // 关注者（粉丝）

  @ManyToOne('User')
  @JoinColumn({ name: 'followerId' })
  follower?: any;

  @Column({ type: 'varchar' })
  followingId!: string; // 被关注者

  @ManyToOne('User')
  @JoinColumn({ name: 'followingId' })
  following?: any;

  @CreateDateColumn()
  createdAt!: Date;
}
