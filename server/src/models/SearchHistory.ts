import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

@Entity('search_history')
@Index(['userId', 'createdAt'])
export class SearchHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'userId' })
  user: any;

  @Column({ type: 'varchar', length: 100 })
  keyword: string;

  @Column({ type: 'integer', default: 0 })
  resultCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
