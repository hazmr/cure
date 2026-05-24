import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { toPaginatedResult } from '../common/interfaces/paginated-result.interface';
import { isUniqueViolation } from '../common/utils/database-errors';
import { Booking } from '../database/booking.entity';
import { BookingStatus, UserRole } from '../database/enums';
import { Patient } from '../database/patient.entity';
import { PatientsService } from '../patients/patients.service';
import { assertBookingStatusTransition } from './booking-status';
import { BookingQueryDto } from './dto/booking-query.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly patientsService: PatientsService,
  ) {}

  async create(dto: CreateBookingDto, user: RequestUser): Promise<Booking> {
    if (user.role === UserRole.NURSE && dto.nurseId !== user.userId) {
      throw new ForbiddenException('Nurses can only create bookings assigned to themselves');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const patientRepository = queryRunner.manager.getRepository(Patient);
      const bookingRepository = queryRunner.manager.getRepository(Booking);
      const patient = await patientRepository.findOne({ where: { id: dto.patientId } });

      if (!patient) {
        throw new NotFoundException('Patient not found');
      }
      this.patientsService.assertPatientAccess(user, patient);

      await this.assertNoConflict(
        bookingRepository,
        dto.nurseId,
        new Date(dto.scheduledAt),
      );

      const booking = bookingRepository.create({
        patientId: dto.patientId,
        nurseId: dto.nurseId,
        scheduledAt: new Date(dto.scheduledAt),
        durationMinutes: dto.durationMinutes ?? 60,
        status: BookingStatus.REQUESTED,
        reason: dto.reason ?? null,
        location: dto.location ?? null,
        notes: dto.notes ?? null,
      });
      const saved = await bookingRepository.save(booking);
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.throwBookingConflict(error);
    } finally {
      await queryRunner.release();
    }
  }

  async list(query: BookingQueryDto, user: RequestUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.patient', 'patient')
      .leftJoinAndSelect('booking.nurse', 'nurse');

    if (user.role === UserRole.PATIENT) {
      qb.andWhere('patient.userId = :userId', { userId: user.userId });
    } else if (user.role === UserRole.NURSE) {
      qb.andWhere('booking.nurseId = :userId', { userId: user.userId });
    }

    if (query.patientId) {
      qb.andWhere('booking.patientId = :patientId', { patientId: query.patientId });
    }
    if (query.nurseId) {
      qb.andWhere('booking.nurseId = :nurseId', { nurseId: query.nurseId });
    }
    if (query.status) {
      qb.andWhere('booking.status = :status', { status: query.status });
    }
    if (query.from) {
      qb.andWhere('booking.scheduledAt >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('booking.scheduledAt <= :to', { to: new Date(query.to) });
    }

    const sortBy = ['scheduledAt', 'createdAt', 'status'].includes(query.sortBy ?? '')
      ? query.sortBy
      : 'scheduledAt';
    qb.orderBy(`booking.${sortBy}`, (query.sortOrder ?? 'ASC').toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [bookings, total] = await qb.getManyAndCount();
    return toPaginatedResult(bookings, total, page, limit);
  }

  async findOne(id: string, user: RequestUser): Promise<Booking> {
    const booking = await this.findBookingEntity(id);
    this.assertBookingAccess(user, booking);
    return booking;
  }

  async update(id: string, dto: UpdateBookingDto, user: RequestUser): Promise<Booking> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const bookingRepository = queryRunner.manager.getRepository(Booking);
      const patientRepository = queryRunner.manager.getRepository(Patient);
      const booking = await bookingRepository.findOne({
        where: { id },
        relations: { patient: true },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      this.assertBookingAccess(user, booking);

      if (user.role === UserRole.PATIENT && (dto.nurseId || dto.patientId)) {
        throw new ForbiddenException('Patients cannot reassign bookings');
      }
      if (user.role === UserRole.NURSE && dto.nurseId && dto.nurseId !== user.userId) {
        throw new ForbiddenException('Nurses cannot assign bookings to other nurses');
      }

      if (dto.patientId) {
        const patient = await patientRepository.findOne({ where: { id: dto.patientId } });
        if (!patient) {
          throw new NotFoundException('Patient not found');
        }
        this.patientsService.assertPatientAccess(user, patient);
        booking.patientId = dto.patientId;
      }

      if (dto.nurseId) {
        booking.nurseId = dto.nurseId;
      }
      if (dto.scheduledAt) {
        booking.scheduledAt = new Date(dto.scheduledAt);
      }
      if (dto.durationMinutes !== undefined) {
        booking.durationMinutes = dto.durationMinutes;
      }
      if (dto.reason !== undefined) {
        booking.reason = dto.reason;
      }
      if (dto.location !== undefined) {
        booking.location = dto.location;
      }
      if (dto.notes !== undefined) {
        booking.notes = dto.notes;
      }

      if (booking.status !== BookingStatus.CANCELLED) {
        await this.assertNoConflict(
          bookingRepository,
          booking.nurseId,
          booking.scheduledAt,
          booking.id,
        );
      }

      const saved = await bookingRepository.save(booking);
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.throwBookingConflict(error);
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(
    id: string,
    dto: UpdateBookingStatusDto,
    user: RequestUser,
  ): Promise<Booking> {
    const booking = await this.findBookingEntity(id);
    this.assertBookingAccess(user, booking);

    if (user.role === UserRole.PATIENT && dto.status !== BookingStatus.CANCELLED) {
      throw new ForbiddenException('Patients can only cancel bookings');
    }

    assertBookingStatusTransition(booking.status, dto.status);
    booking.status = dto.status;

    try {
      return await this.bookingsRepository.save(booking);
    } catch (error) {
      this.throwBookingConflict(error);
    }
  }

  async remove(id: string, user: RequestUser): Promise<void> {
    const booking = await this.findBookingEntity(id);
    this.assertBookingAccess(user, booking);
    booking.status = BookingStatus.CANCELLED;
    await this.bookingsRepository.save(booking);
    await this.bookingsRepository.softDelete(id);
  }

  private async findBookingEntity(id: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: { patient: true, nurse: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  private assertBookingAccess(user: RequestUser, booking: Booking): void {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.NURSE && booking.nurseId === user.userId) {
      return;
    }

    if (user.role === UserRole.PATIENT && booking.patient?.userId === user.userId) {
      return;
    }

    throw new ForbiddenException('You do not have access to this booking');
  }

  private async assertNoConflict(
    repository: Repository<Booking>,
    nurseId: string,
    scheduledAt: Date,
    excludeBookingId?: string,
  ): Promise<void> {
    const qb = repository
      .createQueryBuilder('booking')
      .where('booking.nurseId = :nurseId', { nurseId })
      .andWhere('booking.scheduledAt = :scheduledAt', { scheduledAt })
      .andWhere('booking.status != :cancelled', { cancelled: BookingStatus.CANCELLED });

    if (excludeBookingId) {
      qb.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }

    if (await qb.getExists()) {
      throw new ConflictException('Nurse already has an active booking at this time');
    }
  }

  private throwBookingConflict(error: unknown): never {
    if (isUniqueViolation(error)) {
      throw new ConflictException('Nurse already has an active booking at this time');
    }

    throw error;
  }
}

