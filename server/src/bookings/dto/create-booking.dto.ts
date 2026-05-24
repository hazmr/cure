import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  patientId!: string;

  @ApiProperty()
  @IsUUID()
  nurseId!: string;

  @ApiProperty({ example: '2026-06-01T10:00:00.000Z' })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({ default: 60 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(15)
  @Max(480)
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

