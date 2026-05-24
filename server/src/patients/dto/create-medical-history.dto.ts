import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { MedicalSeverity } from '../../database/enums';

export class CreateMedicalHistoryDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({ enum: MedicalSeverity, default: MedicalSeverity.LOW })
  @IsOptional()
  @IsEnum(MedicalSeverity)
  severity?: MedicalSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  diagnosedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  resolvedAt?: string;
}

