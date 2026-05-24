import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 30 })
  action!: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  entity!: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  entityId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  oldValues!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  newValues!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ip!: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

