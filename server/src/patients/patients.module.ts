import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalNote } from '../database/clinical-note.entity';
import { MedicalHistory } from '../database/medical-history.entity';
import { Patient } from '../database/patient.entity';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, MedicalHistory, ClinicalNote])],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}

