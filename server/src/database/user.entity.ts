import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { ClinicalNote } from './clinical-note.entity';
import { Patient } from './patient.entity';
import { UserRole } from './enums';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 30, default: UserRole.PATIENT })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  refreshTokenHash!: string | null;

  @Column({ type: 'uuid', nullable: true, select: false })
  refreshTokenId!: string | null;

  @OneToMany(() => Patient, (patient) => patient.user)
  patientProfiles!: Patient[];

  @OneToMany(() => Patient, (patient) => patient.assignedNurse)
  assignedPatients!: Patient[];

  @OneToMany(() => Booking, (booking) => booking.nurse)
  assignedBookings!: Booking[];

  @OneToMany(() => ClinicalNote, (note) => note.author)
  clinicalNotes!: ClinicalNote[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date | null;
}

