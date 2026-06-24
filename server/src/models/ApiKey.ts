import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

export type ApiKeyPlan = 'free' | 'basic' | 'pro' | 'enterprise';
export type ApiKeyStatus = 'pending' | 'active' | 'suspended' | 'revoked';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'user_id' })
  userId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  key: string;

  @Column({ type: 'varchar' })
  secret: string;

  @Column({
    type: 'text',
    default: 'free'
  })
  plan: ApiKeyPlan;

  @Column({ type: 'integer', name: 'rate_limit', default: 100 })
  rateLimit: number;

  @Column({ type: 'simple-json', nullable: true })
  permissions: string[];

  @Column({
    type: 'text',
    default: 'pending'
  })
  status: ApiKeyStatus;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'last_used_at', type: 'datetime', nullable: true })
  lastUsedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// 套餐配置
export const PLAN_CONFIG: Record<ApiKeyPlan, { rateLimit: number; dailyLimit: number; permissions: string[] }> = {
  free: {
    rateLimit: 10,
    dailyLimit: 100,
    permissions: ['inventory:read', 'search:read']
  },
  basic: {
    rateLimit: 30,
    dailyLimit: 1000,
    permissions: ['inventory:read', 'inventory:write', 'orders:read', 'orders:write', 'search:read']
  },
  pro: {
    rateLimit: 100,
    dailyLimit: 10000,
    permissions: ['inventory:read', 'inventory:write', 'orders:read', 'orders:write', 'search:read', 'bom:import', 'webhook:manage']
  },
  enterprise: {
    rateLimit: 1000,
    dailyLimit: -1, // 无限制
    permissions: ['*']
  }
};
