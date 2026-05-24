import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ClinicalNoteType } from '../../database/enums';

export class CreateClinicalNoteDto {
  @ApiPropertyOptional({ enum: ClinicalNoteType, default: ClinicalNoteType.GENERAL })
  @IsOptional()
  @IsEnum(ClinicalNoteType)
  type?: ClinicalNoteType;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  noteDate?: string;
}

