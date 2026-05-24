import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MedicalSeverity } from './enums';
import { Patient } from './patient.entity';
import { User } from './user.entity';

@Entity({ name: 'medical_histories' })
export class MedicalHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => Patient, (patient) => patient.medicalHistories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patientId' })
  patient!: Patient;

  @Column({ type: 'varchar', length: 150 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 30, default: MedicalSeverity.LOW })
  severity!: MedicalSeverity;

  @Column({ type: 'date', nullable: true })
  diagnosedAt!: string | null;

  @Column({ type: 'date', nullable: true })
  resolvedAt!: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  createdById!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

