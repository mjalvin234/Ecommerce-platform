import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 邮箱验证码实体
 */
@Entity('email_verifications')
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'email', type: 'varchar' })
  email: string;

  @Column({ name: 'code', type: 'varchar', length: 6 })
  code: string; // 6位验证码

  @Column({ name: 'type', type: 'varchar' })
  type: 'register' | 'reset_password' | 'change_email'; // 验证类型

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date; // 过期时间

  @Column({ name: 'used', default: false, type: 'boolean' })
  used: boolean; // 是否已使用

  @Column({ name: 'ip_address', nullable: true, type: 'varchar' })
  ipAddress: string; // 请求IP

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
