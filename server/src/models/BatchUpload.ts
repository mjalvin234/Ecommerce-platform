import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

export type BatchUploadStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Entity('batch_uploads')
export class BatchUpload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  sellerId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'sellerId' })
  seller: any;

  @Column({ type: 'varchar' })
  fileName: string;

  @Column({ type: 'integer', default: 0 })
  totalCount: number;

  @Column({ type: 'integer', default: 0 })
  successCount: number;

  @Column({ type: 'integer', default: 0 })
  failCount: number;

  @Column({
    type: 'varchar',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  status: BatchUploadStatus;

  @Column({ type: 'json', nullable: true })
  errors: Array<{ row: number; field: string; message: string }>;

  @CreateDateColumn()
  createdAt: Date;
}
