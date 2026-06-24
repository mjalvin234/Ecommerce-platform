import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'buyer' | 'seller' | 'admin' | 'qa';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'varchar' })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar' })
  passwordHash: string;

  @Column({ name: 'company_name', type: 'varchar' })
  companyName: string;

  @Column({
    type: 'simple-enum',
    enum: ['buyer', 'seller', 'admin', 'qa'],
    default: 'buyer',
  })
  role: UserRole;

  @Column({
    name: 'verification_status',
    type: 'simple-enum',
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  })
  verificationStatus: VerificationStatus;

  @Column({ name: 'anonymous_hash', unique: true, nullable: true, type: 'varchar' })
  anonymousHash: string;

  @Column({ name: 'credit_score', default: 100, type: 'integer' })
  creditScore: number;

  // 银行账户信息（企业用户）
  @Column({ name: 'bank_name', nullable: true, type: 'varchar' })
  bankName: string;

  @Column({ name: 'bank_account', nullable: true, type: 'varchar' })
  bankAccount: string;

  @Column({ name: 'bank_branch', nullable: true, type: 'varchar' })
  bankBranch: string;

  // 企业授权人信息
  @Column({ name: 'authorized_person', nullable: true, type: 'varchar' })
  authorizedPerson: string;

  @Column({ name: 'authorized_phone', nullable: true, type: 'varchar' })
  authorizedPhone: string;

  // 联系方式
  @Column({ name: 'contact_phone', nullable: true, type: 'varchar' })
  contactPhone: string;

  @Column({ nullable: true, type: 'varchar' })
  address: string;

  // 结算收款账号
  @Column({ name: 'alipay_account', nullable: true, type: 'varchar' })
  alipayAccount: string; // 支付宝账号（手机号/邮箱）

  @Column({ name: 'wechat_openid', nullable: true, type: 'varchar' })
  wechatOpenid: string; // 微信openid（企业付款需要）

  // 邮箱验证状态
  @Column({ name: 'email_verified', default: false, type: 'boolean' })
  emailVerified: boolean; // 邮箱是否已验证

  @Column({ name: 'email_verified_at', nullable: true, type: 'datetime' })
  emailVerifiedAt: Date; // 邮箱验证时间

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 关系通过字符串定义，在 TypeORM 同步时会自动关联
  // 不使用装饰器，避免循环依赖问题
}
