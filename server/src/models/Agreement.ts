import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export type AgreementType = 'seller' | 'buyer';

@Entity('agreements')
export class Agreement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({
    type: 'simple-enum',
    enum: ['seller', 'buyer'],
  })
  type: AgreementType;

  @Column({ type: 'varchar' })
  version: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'signed_at' })
  signedAt: Date;

  @Column({ name: 'ip_address', type: 'varchar' })
  ipAddress: string;
}
