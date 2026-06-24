import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique, Index } from 'typeorm';

/**
 * 收藏实体 - 用户收藏库存商品
 */
@Entity('favorites')
@Unique(['userId', 'inventoryId']) // 同一用户不能重复收藏同一商品
@Index(['userId'])
@Index(['inventoryId'])
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  userId!: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'userId' })
  user?: any;

  @Column({ type: 'varchar' })
  inventoryId!: string;

  @ManyToOne('Inventory')
  @JoinColumn({ name: 'inventoryId' })
  inventory?: any;

  @Column({ type: 'text', nullable: true })
  note?: string; // 收藏备注

  @CreateDateColumn()
  createdAt!: Date;
}
