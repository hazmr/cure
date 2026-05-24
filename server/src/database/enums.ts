export enum UserRole {
  ADMIN = 'admin',
  NURSE = 'nurse',
  PATIENT = 'patient',
}

export enum Gender {
  FEMALE = 'female',
  MALE = 'male',
  OTHER = 'other',
  UNKNOWN = 'unknown',
}

export enum MedicalSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ClinicalNoteType {
  GENERAL = 'general',
  PROGRESS = 'progress',
  MEDICATION = 'medication',
  DISCHARGE = 'discharge',
}

export enum BookingStatus {
  REQUESTED = 'requested',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

