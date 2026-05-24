import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710000000000 implements MigrationInterface {
  name = 'InitialSchema1710000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL UNIQUE,
        "passwordHash" varchar(255) NOT NULL,
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "role" varchar(30) NOT NULL DEFAULT 'patient',
        "isActive" boolean NOT NULL DEFAULT true,
        "refreshTokenHash" varchar(255),
        "refreshTokenId" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "patients" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "assignedNurseId" uuid,
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "birthDate" date,
        "gender" varchar(30) NOT NULL DEFAULT 'unknown',
        "phone" varchar(50),
        "email" varchar(255),
        "address" text,
        "emergencyContactName" varchar(150),
        "emergencyContactPhone" varchar(50),
        "allergies" text,
        "createdById" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz,
        CONSTRAINT "fk_patients_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_patients_assigned_nurse" FOREIGN KEY ("assignedNurseId") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_patients_created_by" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "medical_histories" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "patientId" uuid NOT NULL,
        "title" varchar(150) NOT NULL,
        "description" text NOT NULL,
        "severity" varchar(30) NOT NULL DEFAULT 'low',
        "diagnosedAt" date,
        "resolvedAt" date,
        "createdById" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_medical_histories_patient" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_medical_histories_created_by" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "clinical_notes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "patientId" uuid NOT NULL,
        "authorId" uuid NOT NULL,
        "type" varchar(30) NOT NULL DEFAULT 'general',
        "content" text NOT NULL,
        "noteDate" timestamptz NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz,
        CONSTRAINT "fk_clinical_notes_patient" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_clinical_notes_author" FOREIGN KEY ("authorId") REFERENCES "users"("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "patientId" uuid NOT NULL,
        "nurseId" uuid NOT NULL,
        "scheduledAt" timestamptz NOT NULL,
        "durationMinutes" integer NOT NULL DEFAULT 60,
        "status" varchar(30) NOT NULL DEFAULT 'requested',
        "reason" varchar(255),
        "location" varchar(255),
        "notes" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz,
        CONSTRAINT "fk_bookings_patient" FOREIGN KEY ("patientId") REFERENCES "patients"("id"),
        CONSTRAINT "fk_bookings_nurse" FOREIGN KEY ("nurseId") REFERENCES "users"("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "action" varchar(30) NOT NULL,
        "entity" varchar(100) NOT NULL,
        "entityId" varchar(100),
        "oldValues" jsonb,
        "newValues" jsonb,
        "ip" varchar(100),
        "userAgent" text,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX "idx_patients_userId" ON "patients" ("userId")');
    await queryRunner.query('CREATE INDEX "idx_patients_assignedNurseId" ON "patients" ("assignedNurseId")');
    await queryRunner.query('CREATE INDEX "idx_medical_histories_patientId" ON "medical_histories" ("patientId")');
    await queryRunner.query('CREATE INDEX "idx_clinical_notes_patientId" ON "clinical_notes" ("patientId")');
    await queryRunner.query('CREATE INDEX "idx_clinical_notes_authorId" ON "clinical_notes" ("authorId")');
    await queryRunner.query('CREATE INDEX "idx_bookings_patientId" ON "bookings" ("patientId")');
    await queryRunner.query('CREATE INDEX "idx_bookings_nurseId" ON "bookings" ("nurseId")');
    await queryRunner.query('CREATE INDEX "idx_bookings_status" ON "bookings" ("status")');
    await queryRunner.query('CREATE INDEX "idx_bookings_scheduledAt" ON "bookings" ("scheduledAt")');
    await queryRunner.query(
      'CREATE UNIQUE INDEX "idx_bookings_nurse_scheduled_active_unique" ON "bookings" ("nurseId", "scheduledAt") WHERE "status" NOT IN (\'cancelled\')',
    );
    await queryRunner.query('CREATE INDEX "idx_audit_logs_userId" ON "audit_logs" ("userId")');
    await queryRunner.query('CREATE INDEX "idx_audit_logs_action" ON "audit_logs" ("action")');
    await queryRunner.query('CREATE INDEX "idx_audit_logs_entity" ON "audit_logs" ("entity")');
    await queryRunner.query('CREATE INDEX "idx_audit_logs_entityId" ON "audit_logs" ("entityId")');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "audit_logs"');
    await queryRunner.query('DROP TABLE IF EXISTS "bookings"');
    await queryRunner.query('DROP TABLE IF EXISTS "clinical_notes"');
    await queryRunner.query('DROP TABLE IF EXISTS "medical_histories"');
    await queryRunner.query('DROP TABLE IF EXISTS "patients"');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');
  }
}

