import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 管理员邮箱配置实体
 *
 * 用于存储接收通知邮件的管理员邮箱地址
 */
@Entity('admin_emails')
@Index('idx_admin_emails_email', ['email'], { unique: true })
export class AdminEmail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  name: string;  // 联系人名称

  @Column({
    name: 'is_primary',
    type: 'boolean',
    default: false,
  })
  isPrimary: boolean;  // 是否主邮箱

  @Column({
    type: 'boolean',
    default: false,
  })
  verified: boolean;  // 是否已验证

  @Column({
    type: 'boolean',
    default: true,
  })
  active: boolean;  // 是否启用

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
