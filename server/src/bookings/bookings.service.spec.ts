import { ConflictException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Booking } from '../database/booking.entity';
import { BookingStatus, UserRole } from '../database/enums';
import { Patient } from '../database/patient.entity';
import { PatientsService } from '../patients/patients.service';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  it('rejects conflicting nurse/time bookings before insert', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getExists: jest.fn().mockResolvedValue(true),
    };
    const bookingRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as Repository<Booking>;
    const patientRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'patient-id',
        assignedNurseId: 'nurse-id',
        userId: 'patient-user-id',
      }),
    } as unknown as Repository<Patient>;
    const queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        getRepository: jest.fn((entity) =>
          entity === Patient ? patientRepository : bookingRepository,
        ),
      },
    };
    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as DataSource;
    const patientsService = {
      assertPatientAccess: jest.fn(),
    } as unknown as PatientsService;
    const service = new BookingsService(
      {} as Repository<Booking>,
      {} as Repository<Patient>,
      dataSource,
      patientsService,
    );

    await expect(
      service.create(
        {
          patientId: 'patient-id',
          nurseId: 'nurse-id',
          scheduledAt: '2026-06-01T10:00:00.000Z',
        },
        {
          userId: 'admin-id',
          email: 'admin@cure.local',
          role: UserRole.ADMIN,
        },
      ),
    ).rejects.toThrow(ConflictException);

    expect(queryRunner.startTransaction).toHaveBeenCalledWith('SERIALIZABLE');
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(bookingRepository.save).not.toHaveBeenCalled();
  });

  it('maps PostgreSQL unique violations to booking conflicts', async () => {
    const bookingRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'booking-id',
        nurseId: 'nurse-id',
        patient: { userId: 'patient-user-id' },
        status: BookingStatus.REQUESTED,
      }),
      save: jest.fn().mockRejectedValue({ code: '23505' }),
    } as unknown as Repository<Booking>;
    const service = new BookingsService(
      bookingRepository,
      {} as Repository<Patient>,
      {} as DataSource,
      {} as PatientsService,
    );

    await expect(
      service.updateStatus(
        'booking-id',
        { status: BookingStatus.CONFIRMED },
        {
          userId: 'nurse-id',
          email: 'nurse@cure.local',
          role: UserRole.NURSE,
        },
      ),
    ).rejects.toThrow(ConflictException);
  });
});

