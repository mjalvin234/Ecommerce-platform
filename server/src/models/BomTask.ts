import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

export type BomTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface BomItem {
  model: string;          // 型号
  brand?: string;         // 品牌
  quantity: number;       // 数量
  targetPrice?: number;   // 目标价
  remark?: string;        // 备注
  matchedInventoryId?: string;  // 匹配的库存ID
  matchedPrice?: number;        // 匹配的价格
  matchStatus?: 'matched' | 'partial' | 'not_found';  // 匹配状态
}

@Entity('bom_tasks')
export class BomTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'user_id' })
  userId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ type: 'varchar', name: 'file_name' })
  fileName: string;

  @Column({ type: 'varchar', name: 'original_file', nullable: true })
  originalFile: string | null;

  @Column({ type: 'integer', name: 'total_count', default: 0 })
  totalCount: number;

  @Column({ type: 'integer', name: 'matched_count', default: 0 })
  matchedCount: number;

  @Column({ type: 'integer', name: 'partial_count', default: 0 })
  partialCount: number;

  @Column({ type: 'integer', name: 'not_found_count', default: 0 })
  notFoundCount: number;

  @Column({
    type: 'text',
    default: 'pending'
  })
  status: BomTaskStatus;

  @Column({ type: 'simple-json', nullable: true })
  items: BomItem[] | null;

  @Column({ type: 'varchar', name: 'result_url', nullable: true })
  resultUrl: string | null;

  @Column({ type: 'varchar', name: 'error_message', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date | null;
}
