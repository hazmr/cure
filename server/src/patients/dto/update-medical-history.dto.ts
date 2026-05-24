import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { MedicalSeverity } from '../../database/enums';

export class UpdateMedicalHistoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: MedicalSeverity })
  @IsOptional()
  @IsEnum(MedicalSeverity)
  severity?: MedicalSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  diagnosedAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  resolvedAt?: string | null;
}

