import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClinicalNoteType } from './enums';
import { Patient } from './patient.entity';
import { User } from './user.entity';

@Entity({ name: 'clinical_notes' })
export class ClinicalNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => Patient, (patient) => patient.clinicalNotes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patientId' })
  patient!: Patient;

  @Index()
  @Column({ type: 'uuid' })
  authorId!: string;

  @ManyToOne(() => User, (user) => user.clinicalNotes)
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @Column({ type: 'varchar', length: 30, default: ClinicalNoteType.GENERAL })
  type!: ClinicalNoteType;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'timestamptz' })
  noteDate!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date | null;
}

