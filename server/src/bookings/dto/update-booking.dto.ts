import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class UpdateBookingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  nurseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(15)
  @Max(480)
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}

