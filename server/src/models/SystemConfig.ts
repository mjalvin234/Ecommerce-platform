import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 系统配置实体
 * 存储平台全局配置信息
 */
@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 基础配置
  @Column({ name: 'site_name', type: 'varchar', default: '芯核交易中心' })
  siteName: string;

  @Column({ name: 'site_description', type: 'varchar', default: '专业的电子元器件交易平台' })
  siteDescription: string;

  // 联系方式
  @Column({ name: 'contact_email', type: 'varchar', default: 'support@coretrading.com' })
  contactEmail: string;

  @Column({ name: 'contact_phone', type: 'varchar', default: '400-888-8888' })
  contactPhone: string;

  @Column({ name: 'business_email', type: 'varchar', nullable: true })
  businessEmail: string;  // 商务合作邮箱

  @Column({ name: 'privacy_email', type: 'varchar', nullable: true })
  privacyEmail: string;  // 隐私政策邮箱

  @Column({ name: 'legal_email', type: 'varchar', nullable: true })
  legalEmail: string;  // 法务邮箱

  // 公司地址
  @Column({ type: 'varchar', default: '广东省深圳市龙岗区平湖街道XX物流园3区' })
  address: string;

  @Column({ name: 'lab_info', type: 'varchar', nullable: true })
  labInfo: string;  // 质检实验室信息

  // 平台对公账户信息
  @Column({ name: 'platform_bank_name', type: 'varchar', default: '招商银行深圳科苑支行' })
  platformBankName: string;  // 平台开户行

  @Column({ name: 'platform_bank_account', type: 'varchar', default: '7559 8888 6666 888' })
  platformBankAccount: string;  // 平台银行账号

  @Column({ name: 'platform_bank_holder', type: 'varchar', default: '芯核交易平台（深圳）资金暂存专户' })
  platformBankHolder: string;  // 平台开户名

  // 公司信息
  @Column({ name: 'company_name', type: 'varchar', default: '深圳芯核科技有限公司' })
  companyName: string;

  @Column({ name: 'founded_year', type: 'varchar', default: '2024' })
  foundedYear: string;

  @Column({ name: 'registered_capital', type: 'varchar', default: '1000万元' })
  registeredCapital: string;

  @Column({ name: 'employee_count', type: 'varchar', default: '50-100人' })
  employeeCount: string;

  @Column({ name: 'customer_count', type: 'varchar', default: '1000+' })
  customerCount: string;

  // 功能开关
  @Column({ name: 'enable_registration', type: 'boolean', default: true })
  enableRegistration: boolean;

  @Column({ name: 'enable_email_verification', type: 'boolean', default: true })
  enableEmailVerification: boolean;

  @Column({ name: 'enable_sms_verification', type: 'boolean', default: false })
  enableSmsVerification: boolean;

  // 安全设置
  @Column({ name: 'max_login_attempts', type: 'integer', default: 5 })
  maxLoginAttempts: number;

  @Column({ name: 'session_timeout', type: 'integer', default: 30 })
  sessionTimeout: number;  // 分钟

  @Column({ name: 'min_password_length', type: 'integer', default: 8 })
  minPasswordLength: number;

  @Column({ name: 'require_password_uppercase', type: 'boolean', default: true })
  requirePasswordUppercase: boolean;

  @Column({ name: 'require_password_number', type: 'boolean', default: true })
  requirePasswordNumber: boolean;

  @Column({ name: 'require_password_special', type: 'boolean', default: false })
  requirePasswordSpecial: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
