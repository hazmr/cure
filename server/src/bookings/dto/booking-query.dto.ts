import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { BookingStatus } from '../../database/enums';

export class BookingQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  nurseId?: string;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;
}

