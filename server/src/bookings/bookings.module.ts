import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../database/booking.entity';
import { Patient } from '../database/patient.entity';
import { PatientsModule } from '../patients/patients.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Patient]), PatientsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}

