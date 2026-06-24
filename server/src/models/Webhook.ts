import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type WebhookEvent =
  | 'order.created'
  | 'order.paid'
  | 'order.shipped'
  | 'order.completed'
  | 'order.cancelled'
  | 'inventory.created'
  | 'inventory.updated'
  | 'inventory.low_stock'
  | 'payment.received'
  | 'payment.failed';

@Entity('webhooks')
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'user_id' })
  userId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ type: 'varchar' })
  secret: string;

  @Column({ type: 'simple-json' })
  events: WebhookEvent[];

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('webhook_logs')
export class WebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'webhook_id' })
  webhookId: string;

  @ManyToOne(() => Webhook)
  @JoinColumn({ name: 'webhook_id' })
  webhook: Webhook;

  @Column({ type: 'varchar', name: 'event_type' })
  eventType: WebhookEvent;

  @Column({ name: 'request_body', type: 'text' })
  requestBody: string;

  @Column({ type: 'integer', name: 'response_status', nullable: true })
  responseStatus: number | null;

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody: string | null;

  @Column({ type: 'integer', nullable: true })
  duration: number | null;

  @Column({ type: 'boolean' })
  success: boolean;

  @Column({ type: 'varchar', name: 'error_message', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'integer', name: 'retry_count', default: 0 })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
