import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { ClinicalNote } from './clinical-note.entity';
import { Gender } from './enums';
import { MedicalHistory } from './medical-history.entity';
import { User } from './user.entity';

@Entity({ name: 'patients' })
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, (user) => user.patientProfiles, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  assignedNurseId!: string | null;

  @ManyToOne(() => User, (user) => user.assignedPatients, { nullable: true })
  @JoinColumn({ name: 'assignedNurseId' })
  assignedNurse!: User | null;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'date', nullable: true })
  birthDate!: string | null;

  @Column({ type: 'varchar', length: 30, default: Gender.UNKNOWN })
  gender!: Gender;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  emergencyContactName!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  emergencyContactPhone!: string | null;

  @Column({ type: 'text', nullable: true })
  allergies!: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  createdById!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User | null;

  @OneToMany(() => MedicalHistory, (history) => history.patient)
  medicalHistories!: MedicalHistory[];

  @OneToMany(() => ClinicalNote, (note) => note.patient)
  clinicalNotes!: ClinicalNote[];

  @OneToMany(() => Booking, (booking) => booking.patient)
  bookings!: Booking[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date | null;
}

