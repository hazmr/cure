import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { Gender } from '../../database/enums';

export class PatientQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedNurseId?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}

