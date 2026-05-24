import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ClinicalNoteType } from '../../database/enums';

export class UpdateClinicalNoteDto {
  @ApiPropertyOptional({ enum: ClinicalNoteType })
  @IsOptional()
  @IsEnum(ClinicalNoteType)
  type?: ClinicalNoteType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  noteDate?: string;
}

