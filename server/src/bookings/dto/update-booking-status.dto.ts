import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BookingStatus } from '../../database/enums';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus })
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}

