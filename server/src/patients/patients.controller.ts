import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { UserRole } from '../database/enums';
import { CreateClinicalNoteDto } from './dto/create-clinical-note.dto';
import { CreateMedicalHistoryDto } from './dto/create-medical-history.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { UpdateClinicalNoteDto } from './dto/update-clinical-note.dto';
import { UpdateMedicalHistoryDto } from './dto/update-medical-history.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
@Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.PATIENT)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  create(@Body() dto: CreatePatientDto, @CurrentUser() user: RequestUser) {
    return this.patientsService.create(dto, user);
  }

  @Get()
  list(@Query() query: PatientQueryDto, @CurrentUser() user: RequestUser) {
    return this.patientsService.list(query, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.patientsService.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto, @CurrentUser() user: RequestUser) {
    return this.patientsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }

  @Get(':id/medical-history')
  listMedicalHistory(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.patientsService.listMedicalHistory(id, user);
  }

  @Post(':id/medical-history')
  createMedicalHistory(
    @Param('id') id: string,
    @Body() dto: CreateMedicalHistoryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.patientsService.createMedicalHistory(id, dto, user);
  }

  @Patch(':id/medical-history/:historyId')
  updateMedicalHistory(
    @Param('id') id: string,
    @Param('historyId') historyId: string,
    @Body() dto: UpdateMedicalHistoryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.patientsService.updateMedicalHistory(id, historyId, dto, user);
  }

  @Delete(':id/medical-history/:historyId')
  @HttpCode(204)
  removeMedicalHistory(
    @Param('id') id: string,
    @Param('historyId') historyId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.patientsService.removeMedicalHistory(id, historyId, user);
  }

  @Get(':id/clinical-notes')
  listClinicalNotes(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.patientsService.listClinicalNotes(id, user);
  }

  @Post(':id/clinical-notes')
  @Roles(UserRole.ADMIN, UserRole.NURSE)
  createClinicalNote(
    @Param('id') id: string,
    @Body() dto: CreateClinicalNoteDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.patientsService.createClinicalNote(id, dto, user);
  }

  @Patch(':id/clinical-notes/:noteId')
  @Roles(UserRole.ADMIN, UserRole.NURSE)
  updateClinicalNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @Body() dto: UpdateClinicalNoteDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.patientsService.updateClinicalNote(id, noteId, dto, user);
  }

  @Delete(':id/clinical-notes/:noteId')
  @Roles(UserRole.ADMIN, UserRole.NURSE)
  @HttpCode(204)
  removeClinicalNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.patientsService.removeClinicalNote(id, noteId, user);
  }
}

