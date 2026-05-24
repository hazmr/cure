import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Gender } from '../../database/enums';

export class CreatePatientDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedNurseId?: string;

  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  allergies?: string;
}

