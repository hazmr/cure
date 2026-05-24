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
import { BookingStatus } from './enums';
import { Patient } from './patient.entity';
import { User } from './user.entity';

@Entity({ name: 'bookings' })
@Index('idx_bookings_nurse_scheduled_active_lookup', ['nurseId', 'scheduledAt'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => Patient, (patient) => patient.bookings)
  @JoinColumn({ name: 'patientId' })
  patient!: Patient;

  @Index()
  @Column({ type: 'uuid' })
  nurseId!: string;

  @ManyToOne(() => User, (user) => user.assignedBookings)
  @JoinColumn({ name: 'nurseId' })
  nurse!: User;

  @Index()
  @Column({ type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ type: 'integer', default: 60 })
  durationMinutes!: number;

  @Index()
  @Column({ type: 'varchar', length: 30, default: BookingStatus.REQUESTED })
  status!: BookingStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date | null;
}

