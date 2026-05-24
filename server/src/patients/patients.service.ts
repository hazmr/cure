import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { toPaginatedResult } from '../common/interfaces/paginated-result.interface';
import { ClinicalNote } from '../database/clinical-note.entity';
import { ClinicalNoteType, Gender, MedicalSeverity, UserRole } from '../database/enums';
import { MedicalHistory } from '../database/medical-history.entity';
import { Patient } from '../database/patient.entity';
import { CreateClinicalNoteDto } from './dto/create-clinical-note.dto';
import { CreateMedicalHistoryDto } from './dto/create-medical-history.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { UpdateClinicalNoteDto } from './dto/update-clinical-note.dto';
import { UpdateMedicalHistoryDto } from './dto/update-medical-history.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(MedicalHistory)
    private readonly medicalHistoryRepository: Repository<MedicalHistory>,
    @InjectRepository(ClinicalNote)
    private readonly clinicalNotesRepository: Repository<ClinicalNote>,
  ) {}

  async create(dto: CreatePatientDto, user: RequestUser): Promise<Patient> {
    const patient = this.patientsRepository.create({
      ...dto,
      userId: user.role === UserRole.PATIENT ? user.userId : (dto.userId ?? null),
      assignedNurseId: user.role === UserRole.NURSE ? user.userId : (dto.assignedNurseId ?? null),
      birthDate: dto.birthDate ?? null,
      gender: dto.gender ?? Gender.UNKNOWN,
      phone: dto.phone ?? null,
      email: dto.email?.toLowerCase() ?? null,
      address: dto.address ?? null,
      emergencyContactName: dto.emergencyContactName ?? null,
      emergencyContactPhone: dto.emergencyContactPhone ?? null,
      allergies: dto.allergies ?? null,
      createdById: user.userId,
    });

    return this.patientsRepository.save(patient);
  }

  async list(query: PatientQueryDto, user: RequestUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.patientsRepository.createQueryBuilder('patient');

    if (user.role === UserRole.PATIENT) {
      qb.andWhere('patient.userId = :userId', { userId: user.userId });
    } else if (user.role === UserRole.NURSE) {
      qb.andWhere('patient.assignedNurseId = :userId', { userId: user.userId });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(patient.firstName) LIKE :search OR LOWER(patient.lastName) LIKE :search OR LOWER(patient.email) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    if (query.assignedNurseId) {
      qb.andWhere('patient.assignedNurseId = :assignedNurseId', {
        assignedNurseId: query.assignedNurseId,
      });
    }

    if (query.gender) {
      qb.andWhere('patient.gender = :gender', { gender: query.gender });
    }

    const sortBy = ['firstName', 'lastName', 'birthDate', 'createdAt'].includes(query.sortBy ?? '')
      ? query.sortBy
      : 'createdAt';
    qb.orderBy(`patient.${sortBy}`, (query.sortOrder ?? 'DESC').toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [patients, total] = await qb.getManyAndCount();
    return toPaginatedResult(patients, total, page, limit);
  }

  async findOne(id: string, user: RequestUser): Promise<Patient> {
    const patient = await this.findPatientEntity(id);
    this.assertPatientAccess(user, patient);
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto, user: RequestUser): Promise<Patient> {
    const patient = await this.findPatientEntity(id);
    this.assertPatientAccess(user, patient);

    const protectedFields: Array<keyof UpdatePatientDto> = ['userId', 'assignedNurseId'];
    for (const field of protectedFields) {
      if (dto[field] !== undefined && user.role !== UserRole.ADMIN) {
        throw new ForbiddenException(`Only admins can update ${field}`);
      }
    }

    Object.assign(patient, {
      ...dto,
      email: dto.email === undefined ? patient.email : dto.email?.toLowerCase() ?? null,
    });

    return this.patientsRepository.save(patient);
  }

  async remove(id: string): Promise<void> {
    await this.patientsRepository.softDelete(id);
  }

  async listMedicalHistory(patientId: string, user: RequestUser): Promise<MedicalHistory[]> {
    const patient = await this.findPatientEntity(patientId);
    this.assertPatientAccess(user, patient);
    return this.medicalHistoryRepository.find({
      where: { patientId },
      order: { diagnosedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async createMedicalHistory(
    patientId: string,
    dto: CreateMedicalHistoryDto,
    user: RequestUser,
  ): Promise<MedicalHistory> {
    const patient = await this.findPatientEntity(patientId);
    this.assertPatientAccess(user, patient);
    const history = this.medicalHistoryRepository.create({
      ...dto,
      patientId,
      severity: dto.severity ?? MedicalSeverity.LOW,
      diagnosedAt: dto.diagnosedAt ?? null,
      resolvedAt: dto.resolvedAt ?? null,
      createdById: user.userId,
    });
    return this.medicalHistoryRepository.save(history);
  }

  async updateMedicalHistory(
    patientId: string,
    historyId: string,
    dto: UpdateMedicalHistoryDto,
    user: RequestUser,
  ): Promise<MedicalHistory> {
    const patient = await this.findPatientEntity(patientId);
    this.assertPatientAccess(user, patient);
    const history = await this.findMedicalHistoryEntity(patientId, historyId);
    Object.assign(history, dto);
    return this.medicalHistoryRepository.save(history);
  }

  async removeMedicalHistory(patientId: string, historyId: string, user: RequestUser): Promise<void> {
    const patient = await this.findPatientEntity(patientId);
    this.assertPatientAccess(user, patient);
    await this.findMedicalHistoryEntity(patientId, historyId);
    await this.medicalHistoryRepository.delete({ id: historyId, patientId });
  }

  async listClinicalNotes(patientId: string, user: RequestUser): Promise<ClinicalNote[]> {
    const patient = await this.findPatientEntity(patientId);
    this.assertPatientAccess(user, patient);
    return this.clinicalNotesRepository.find({
      where: { patientId },
      order: { noteDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async createClinicalNote(
    patientId: string,
    dto: CreateClinicalNoteDto,
    user: RequestUser,
  ): Promise<ClinicalNote> {
    if (user.role === UserRole.PATIENT) {
      throw new ForbiddenException('Patients cannot create clinical notes');
    }

    const patient = await this.findPatientEntity(patientId);
    this.assertPatientAccess(user, patient);
    const note = this.clinicalNotesRepository.create({
      patientId,
      authorId: user.userId,
      type: dto.type ?? ClinicalNoteType.GENERAL,
      content: dto.content,
      noteDate: dto.noteDate ? new Date(dto.noteDate) : new Date(),
    });
    return this.clinicalNotesRepository.save(note);
  }

  async updateClinicalNote(
    patientId: string,
    noteId: string,
    dto: UpdateClinicalNoteDto,
    user: RequestUser,
  ): Promise<ClinicalNote> {
    if (user.role === UserRole.PATIENT) {
      throw new ForbiddenException('Patients cannot update clinical notes');
    }

    const patient = await this.findPatientEntity(patientId);
    this.assertPatientAccess(user, patient);
    const note = await this.findClinicalNoteEntity(patientId, noteId);
    Object.assign(note, {
      ...dto,
      noteDate: dto.noteDate ? new Date(dto.noteDate) : note.noteDate,
    });
    return this.clinicalNotesRepository.save(note);
  }

  async removeClinicalNote(patientId: string, noteId: string, user: RequestUser): Promise<void> {
    if (user.role === UserRole.PATIENT) {
      throw new ForbiddenException('Patients cannot delete clinical notes');
    }

    const patient = await this.findPatientEntity(patientId);
    this.assertPatientAccess(user, patient);
    await this.findClinicalNoteEntity(patientId, noteId);
    await this.clinicalNotesRepository.softDelete({ id: noteId, patientId });
  }

  async findPatientEntity(id: string): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  assertPatientAccess(user: RequestUser, patient: Patient): void {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.PATIENT && patient.userId === user.userId) {
      return;
    }

    if (user.role === UserRole.NURSE && patient.assignedNurseId === user.userId) {
      return;
    }

    throw new ForbiddenException('You do not have access to this patient');
  }

  private async findMedicalHistoryEntity(
    patientId: string,
    historyId: string,
  ): Promise<MedicalHistory> {
    const history = await this.medicalHistoryRepository.findOne({
      where: { id: historyId, patientId },
    });

    if (!history) {
      throw new NotFoundException('Medical history not found');
    }

    return history;
  }

  private async findClinicalNoteEntity(patientId: string, noteId: string): Promise<ClinicalNote> {
    const note = await this.clinicalNotesRepository.findOne({
      where: { id: noteId, patientId },
    });

    if (!note) {
      throw new NotFoundException('Clinical note not found');
    }

    return note;
  }
}

