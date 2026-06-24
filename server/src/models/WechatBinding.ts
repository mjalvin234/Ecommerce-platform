import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

@Entity('wechat_bindings')
export class WechatBinding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  userId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'userId' })
  user: any;

  @Column({ type: 'varchar', unique: true })
  openid: string;

  @Column({ type: 'varchar', nullable: true })
  unionid: string;

  @Column({ type: 'varchar', nullable: true })
  nickname: string;

  @Column({ type: 'varchar', nullable: true })
  headimgurl: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  unbindAt: Date;
}

@Entity('wechat_login_sessions')
export class WechatLoginSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  scene: string;

  @Column({ type: 'varchar', nullable: true })
  ticket: string;

  @Column({ type: 'varchar', nullable: true })
  qrcodeUrl: string;

  @Column({
    type: 'varchar',
    enum: ['pending', 'scanned', 'confirmed', 'expired', 'cancelled'],
    default: 'pending'
  })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  openid: string;

  @Column({ type: 'varchar', nullable: true })
  userId: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
