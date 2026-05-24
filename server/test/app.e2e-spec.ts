import { CanActivate, ExecutionContext, Injectable, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { INestApplication, ConflictException } from '@nestjs/common';
import request from 'supertest';
import { AuditLogsController } from '../src/audit/audit-logs.controller';
import { AuditService } from '../src/audit/audit.service';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { BookingsController } from '../src/bookings/bookings.controller';
import { BookingsService } from '../src/bookings/bookings.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { ApiResponseInterceptor } from '../src/common/interceptors/api-response.interceptor';
import { IS_PUBLIC_KEY } from '../src/common/decorators/public.decorator';
import { BookingStatus, UserRole } from '../src/database/enums';
import { HealthController } from '../src/health/health.controller';
import { HealthService } from '../src/health/health.service';
import { PatientsController } from '../src/patients/patients.controller';
import { PatientsService } from '../src/patients/patients.service';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

@Injectable()
class TestJwtGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const role = (request.header('x-test-role') ?? UserRole.ADMIN) as UserRole;
    request.user = {
      userId: request.header('x-test-user-id') ?? `${role}-user-id`,
      email: `${role}@cure.local`,
      role,
    };
    return true;
  }
}

describe('CURE API (e2e)', () => {
  let app: INestApplication;
  const bookingSlots = new Set<string>();
  const patientId = '00000000-0000-4000-8000-000000000001';
  const nurseId = '00000000-0000-4000-8000-000000000002';

  beforeEach(async () => {
    bookingSlots.clear();
    const moduleRef = await Test.createTestingModule({
      controllers: [
        AuthController,
        UsersController,
        PatientsController,
        BookingsController,
        AuditLogsController,
        HealthController,
      ],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn().mockResolvedValue({
              user: { id: 'patient-user-id', role: UserRole.PATIENT },
              accessToken: 'access-token',
              refreshToken: 'refresh-token',
            }),
            login: jest.fn().mockResolvedValue({
              user: { id: 'patient-user-id', role: UserRole.PATIENT },
              accessToken: 'access-token',
              refreshToken: 'refresh-token',
            }),
            refresh: jest.fn().mockResolvedValue({
              user: { id: 'patient-user-id', role: UserRole.PATIENT },
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
            }),
            logout: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: UsersService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 'user-id' }),
            list: jest.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
            findById: jest.fn().mockResolvedValue({ id: 'patient-user-id', role: UserRole.PATIENT }),
            update: jest.fn().mockResolvedValue({ id: 'user-id' }),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PatientsService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 'patient-id', userId: 'patient-user-id' }),
            list: jest.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
            findOne: jest.fn().mockResolvedValue({ id: 'patient-id', userId: 'patient-user-id' }),
            update: jest.fn().mockResolvedValue({ id: 'patient-id', userId: 'patient-user-id' }),
            remove: jest.fn().mockResolvedValue(undefined),
            listMedicalHistory: jest.fn().mockResolvedValue([]),
            createMedicalHistory: jest.fn().mockResolvedValue({ id: 'history-id' }),
            updateMedicalHistory: jest.fn().mockResolvedValue({ id: 'history-id' }),
            removeMedicalHistory: jest.fn().mockResolvedValue(undefined),
            listClinicalNotes: jest.fn().mockResolvedValue([]),
            createClinicalNote: jest.fn().mockResolvedValue({ id: 'note-id' }),
            updateClinicalNote: jest.fn().mockResolvedValue({ id: 'note-id' }),
            removeClinicalNote: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: BookingsService,
          useValue: {
            create: jest.fn(async (dto) => {
              const key = `${dto.nurseId}:${dto.scheduledAt}`;
              if (bookingSlots.has(key)) {
                throw new ConflictException('Nurse already has an active booking at this time');
              }
              bookingSlots.add(key);
              return { id: 'booking-id', status: BookingStatus.REQUESTED, ...dto };
            }),
            list: jest.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
            findOne: jest.fn().mockResolvedValue({ id: 'booking-id', status: BookingStatus.REQUESTED }),
            update: jest.fn().mockResolvedValue({ id: 'booking-id' }),
            updateStatus: jest.fn().mockResolvedValue({ id: 'booking-id', status: BookingStatus.CONFIRMED }),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AuditService,
          useValue: {
            list: jest.fn().mockResolvedValue({
              data: [{ id: 'audit-id', action: 'create', entity: 'patients' }],
              meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
            }),
          },
        },
        {
          provide: HealthService,
          useValue: {
            check: jest.fn().mockResolvedValue({
              status: 'ok',
              services: { app: 'ok', postgres: 'ok', redis: 'ok' },
            }),
          },
        },
        {
          provide: APP_GUARD,
          useClass: TestJwtGuard,
        },
        {
          provide: APP_GUARD,
          useClass: RolesGuard,
        },
        {
          provide: APP_FILTER,
          useClass: HttpExceptionFilter,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: ApiResponseInterceptor,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('runs register, login, me, refresh, and logout', async () => {
    await request(app.getHttpAdapter().getInstance())
      .post('/auth/register')
      .send({
        email: 'patient@cure.local',
        password: 'ValidPass123!',
        firstName: 'Pat',
        lastName: 'Patient',
      })
      .expect(201)
      .expect(({ body }) => expect(body.data.accessToken).toBe('access-token'));

    await request(app.getHttpAdapter().getInstance())
      .post('/auth/login')
      .send({ email: 'patient@cure.local', password: 'ValidPass123!' })
      .expect(200);

    await request(app.getHttpAdapter().getInstance())
      .get('/auth/me')
      .set('x-test-role', UserRole.PATIENT)
      .set('x-test-user-id', 'patient-user-id')
      .expect(200);

    await request(app.getHttpAdapter().getInstance())
      .post('/auth/refresh')
      .send({ refreshToken: 'refresh-token' })
      .expect(200)
      .expect(({ body }) => expect(body.data.accessToken).toBe('new-access-token'));

    await request(app.getHttpAdapter().getInstance())
      .post('/auth/logout')
      .set('x-test-role', UserRole.PATIENT)
      .send({ refreshToken: 'refresh-token' })
      .expect(204);
  });

  it('enforces admin, nurse, and patient RBAC boundaries', async () => {
    await request(app.getHttpAdapter().getInstance()).get('/users').set('x-test-role', UserRole.PATIENT).expect(403);
    await request(app.getHttpAdapter().getInstance()).get('/users').set('x-test-role', UserRole.ADMIN).expect(200);
    await request(app.getHttpAdapter().getInstance())
      .post('/patients/patient-id/clinical-notes')
      .set('x-test-role', UserRole.PATIENT)
      .send({ content: 'Patient cannot create this note' })
      .expect(403);
    await request(app.getHttpAdapter().getInstance())
      .post('/patients/patient-id/clinical-notes')
      .set('x-test-role', UserRole.NURSE)
      .send({ content: 'Nurse note' })
      .expect(201);
  });

  it('covers patient CRUD and nested medical history and notes', async () => {
    await request(app.getHttpAdapter().getInstance())
      .post('/patients')
      .set('x-test-role', UserRole.PATIENT)
      .send({ firstName: 'Pat', lastName: 'Patient' })
      .expect(201);

    await request(app.getHttpAdapter().getInstance()).get('/patients/patient-id').set('x-test-role', UserRole.PATIENT).expect(200);
    await request(app.getHttpAdapter().getInstance())
      .patch('/patients/patient-id')
      .set('x-test-role', UserRole.PATIENT)
      .send({ phone: '+15555555555' })
      .expect(200);
    await request(app.getHttpAdapter().getInstance())
      .post('/patients/patient-id/medical-history')
      .set('x-test-role', UserRole.NURSE)
      .send({ title: 'Hypertension', description: 'Controlled' })
      .expect(201);
    await request(app.getHttpAdapter().getInstance())
      .post('/patients/patient-id/clinical-notes')
      .set('x-test-role', UserRole.NURSE)
      .send({ content: 'Stable vitals' })
      .expect(201);
  });

  it('covers booking creation, filtering, status updates, and double-booking rejection', async () => {
    const booking = {
      patientId,
      nurseId,
      scheduledAt: '2026-06-01T10:00:00.000Z',
    };

    await request(app.getHttpAdapter().getInstance()).post('/bookings').set('x-test-role', UserRole.ADMIN).send(booking).expect(201);
    await request(app.getHttpAdapter().getInstance()).post('/bookings').set('x-test-role', UserRole.ADMIN).send(booking).expect(409);
    await request(app.getHttpAdapter().getInstance()).get('/bookings?status=requested').set('x-test-role', UserRole.ADMIN).expect(200);
    await request(app.getHttpAdapter().getInstance())
      .patch('/bookings/booking-id/status')
      .set('x-test-role', UserRole.NURSE)
      .set('x-test-user-id', nurseId)
      .send({ status: BookingStatus.CONFIRMED })
      .expect(200);
  });

  it('exposes audit logs and health checks', async () => {
    await request(app.getHttpAdapter().getInstance()).get('/audit-logs').set('x-test-role', UserRole.ADMIN).expect(200);
    await request(app.getHttpAdapter().getInstance())
      .get('/health')
      .expect(200)
      .expect(({ body }) => expect(body.data.status).toBe('ok'));
  });
});
