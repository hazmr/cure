import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../database/enums';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ minLength: 10 })
  @IsOptional()
  @IsString()
  @MinLength(10)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

