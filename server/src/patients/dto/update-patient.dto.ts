import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Gender } from '../../database/enums';

export class UpdatePatientDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedNurseId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  birthDate?: string | null;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyContactName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  allergies?: string | null;
}

