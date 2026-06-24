import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

/**
 * 质检状态
 */
export type QualityStatus =
  | 'pending'       // 待质检
  | 'in_progress'   // 质检中
  | 'passed'        // 质检通过
  | 'failed';       // 质检不通过

/**
 * 质检报告实体
 */
@Entity('quality_reports')
@Index('idx_quality_reports_order', ['orderId'])
@Index('idx_quality_reports_status', ['status'])
export class QualityReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_no', unique: true, type: 'varchar' })
  reportNo: string; // 质检报告编号 QC-xxxxxx

  @Column({ name: 'order_id', type: 'varchar' })
  orderId: string;

  @ManyToOne('Order')
  @JoinColumn({ name: 'order_id' })
  order: any;

  @Column({ name: 'uploaded_by', type: 'varchar' })
  uploadedBy: string; // 上传人（卖家）

  @ManyToOne('User')
  @JoinColumn({ name: 'uploaded_by' })
  uploader: any;

  // ===== 质检信息 =====
  @Column({
    type: 'simple-enum',
    enum: ['pending', 'in_progress', 'passed', 'failed'],
    default: 'pending',
  })
  status: QualityStatus;

  @Column({
    name: 'part_number',
    type: 'varchar',
  })
  partNumber: string; // 型号

  @Column({
    type: 'integer',
  })
  quantity: number; // 质检数量

  // ===== 质检文件 =====
  @Column({
    name: 'report_file',
    type: 'varchar',
  })
  reportFile: string; // 质检报告文件URL

  @Column({
    name: 'photos',
    nullable: true,
    type: 'simple-json',
  })
  photos: string[]; // 质检照片URL列表

  @Column({
    name: 'video_url',
    nullable: true,
    type: 'varchar',
  })
  videoUrl: string; // 质检视频URL

  // ===== 质检结论 =====
  @Column({
    type: 'text',
    nullable: true,
  })
  conclusion: string; // 质检结论

  @Column({
    name: 'test_items',
    nullable: true,
    type: 'simple-json',
  })
  testItems: {
    name: string;
    result: 'pass' | 'fail' | 'na';
    value?: string;
    standard?: string;
  }[]; // 检测项目

  @Column({
    name: 'defect_description',
    nullable: true,
    type: 'text',
  })
  defectDescription: string; // 缺陷描述（如有）

  // ===== 审核信息 =====
  @Column({
    name: 'reviewed_by',
    nullable: true,
    type: 'varchar',
  })
  reviewedBy: string; // 审核人

  @Column({
    name: 'reviewed_at',
    nullable: true,
    type: 'datetime',
  })
  reviewedAt: Date;

  @Column({
    name: 'review_notes',
    nullable: true,
    type: 'text',
  })
  reviewNotes: string; // 审核备注

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * 生成质检报告编号
 */
export function generateReportNo(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `QC-${timestamp}${random}`;
}
