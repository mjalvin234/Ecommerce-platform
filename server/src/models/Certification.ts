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
 * 认证类型
 */
export type CertificationType = 'enterprise' | 'individual';

/**
 * 认证状态
 */
export type CertificationStatus = 'pending' | 'approved' | 'rejected';

/**
 * 企业认证实体
 */
@Entity('certifications')
@Index('idx_certifications_user', ['userId'])
@Index('idx_certifications_status', ['status'])
export class Certification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({
    type: 'varchar',
  })
  type: CertificationType;

  @Column({
    type: 'simple-enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: CertificationStatus;

  // ===== 企业信息 =====
  @Column({
    name: 'company_name',
    type: 'varchar',
  })
  companyName: string;

  @Column({
    name: 'credit_code',
    type: 'varchar',
  })
  creditCode: string; // 统一社会信用代码

  @Column({
    name: 'legal_person',
    type: 'varchar',
  })
  legalPerson: string; // 法人姓名

  @Column({
    name: 'legal_id_card',
    type: 'varchar',
  })
  legalIdCard: string; // 法人身份证号（加密存储）

  @Column({
    name: 'contact_phone',
    type: 'varchar',
  })
  contactPhone: string;

  @Column({
    name: 'contact_email',
    nullable: true,
    type: 'varchar',
  })
  contactEmail: string;

  @Column({
    name: 'business_address',
    nullable: true,
    type: 'varchar',
  })
  businessAddress: string;

  // ===== 资质文件 =====
  @Column({
    name: 'business_license',
    type: 'varchar',
  })
  businessLicense: string; // 营业执照URL

  @Column({
    name: 'legal_id_card_front',
    type: 'varchar',
  })
  legalIdCardFront: string; // 身份证正面URL

  @Column({
    name: 'legal_id_card_back',
    type: 'varchar',
  })
  legalIdCardBack: string; // 身份证背面URL

  @Column({
    name: 'bank_account_license',
    nullable: true,
    type: 'varchar',
  })
  bankAccountLicense: string; // 开户许可证URL

  @Column({
    name: 'other_documents',
    nullable: true,
    type: 'simple-json',
  })
  otherDocuments: string[]; // 其他证明材料URL列表

  // ===== 审核信息 =====
  @Column({
    name: 'reviewed_by',
    nullable: true,
    type: 'varchar',
  })
  reviewedBy: string; // 审核人ID

  @ManyToOne('User')
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: any;

  @Column({
    name: 'reviewed_at',
    nullable: true,
    type: 'datetime',
  })
  reviewedAt: Date;

  @Column({
    name: 'reject_reason',
    nullable: true,
    type: 'text',
  })
  rejectReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
