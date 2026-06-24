import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User.js';

/**
 * 登录日志实体
 */
@Entity('login_logs')
export class LoginLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'login_time', type: 'datetime' })
  loginTime: Date;

  @Column({ name: 'ip_address', type: 'varchar' })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true, type: 'varchar' })
  userAgent: string; // 浏览器信息

  @Column({ name: 'device_type', nullable: true, type: 'varchar' })
  deviceType: string; // desktop/mobile/tablet

  @Column({ name: 'os', nullable: true, type: 'varchar' })
  os: string; // 操作系统

  @Column({ name: 'browser', nullable: true, type: 'varchar' })
  browser: string; // 浏览器类型

  @Column({ name: 'location', nullable: true, type: 'varchar' })
  location: string; // 地理位置（根据IP解析）

  @Column({
    name: 'login_status',
    type: 'simple-enum',
    enum: ['success', 'failed'],
    default: 'success',
  })
  loginStatus: 'success' | 'failed';

  @Column({ name: 'fail_reason', nullable: true, type: 'varchar' })
  failReason: string; // 失败原因

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
