import { AuditLog } from './audit-log.entity';
import { Booking } from './booking.entity';
import { ClinicalNote } from './clinical-note.entity';
import { MedicalHistory } from './medical-history.entity';
import { Patient } from './patient.entity';
import { User } from './user.entity';

export const entities = [User, Patient, MedicalHistory, ClinicalNote, Booking, AuditLog];

export { AuditLog, Booking, ClinicalNote, MedicalHistory, Patient, User };

